import { db } from './index';
import { getSupabaseClient, getSupabaseConfigInfo } from './supabase';
import { useSyncStore } from '../store/syncStore';

const SYNC_TABLES = [
  'settings',
  'staff',
  'products',
  'product_batches',
  'customers',
  'suppliers',
  'sales',
  'expenses',
  'purchase_list',
  'logs',
  'partial_payments',
  'day_sessions'
];

let realtimeChannel = null;
let onlineListenersBound = false;

function syncStore() {
  return useSyncStore.getState();
}

async function writeSystemLog(action, details = {}) {
  await db.logs.put({
    id: crypto.randomUUID(),
    action,
    user_id: details.user_id ?? null,
    user_name: details.user_name ?? 'System',
    details,
    timestamp: new Date().toISOString()
  });
}

function getRecordPrimaryKey(tableName, record) {
  if (tableName === 'settings') return record.id ?? 1;
  return record.id;
}

export async function refreshQueueCount() {
  const queueLength = await db.sync_queue.count();
  syncStore().setQueueLength(queueLength);
  return queueLength;
}

export function initializeSyncState(enabled = false) {
  const config = getSupabaseConfigInfo();
  syncStore().setConfigured(config.configured);
  syncStore().setEnabled(enabled);
  syncStore().setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
  refreshQueueCount();

  if (!onlineListenersBound && typeof window !== 'undefined') {
    const handleOnline = () => syncStore().setOnline(true);
    const handleOffline = () => syncStore().setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    onlineListenersBound = true;
  }

  return config;
}

async function processQueueItem(queueItem) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { tableName, action, recordId, data, local_id } = queueItem;
  let error = null;

  if (action === 'DELETE') {
    const response = await supabase.from(tableName).delete().eq('id', recordId);
    error = response.error;
  } else {
    const response = await supabase.from(tableName).upsert(data);
    error = response.error;
  }

  if (error) {
    await db.sync_queue.update(local_id, {
      status: 'failed',
      retries: Number(queueItem.retries || 0) + 1,
      lastError: error.message,
      timestamp: Date.now()
    });
    throw error;
  }

  await db.sync_queue.delete(local_id);
}

export async function pushLocalToCloud({ limit = 100, actor } = {}) {
  const queueItems = await db.sync_queue.orderBy('timestamp').limit(limit).toArray();

  if (!queueItems.length) {
    await refreshQueueCount();
    return { pushed: 0 };
  }

  let pushed = 0;
  for (const item of queueItems) {
    await processQueueItem(item);
    pushed += 1;
  }

  await refreshQueueCount();
  await writeSystemLog('SYNC_PUSH', {
    user_id: actor?.id ?? null,
    user_name: actor?.name ?? 'System',
    pushed,
    queueRemaining: await db.sync_queue.count()
  });

  return { pushed };
}

async function replaceLocalTable(tableName, rows) {
  if (tableName === 'logs') {
    if (rows.length) {
      await db.logs.bulkPut(rows);
    }
    return;
  }

  const table = db.table(tableName);
  await table.clear();
  if (rows.length) {
    await table.bulkPut(rows);
  }
}

export async function pullCloudToLocal({ actor } = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const pulledTables = [];

  for (const tableName of SYNC_TABLES) {
    const response = await supabase.from(tableName).select('*');
    if (response.error) {
      throw response.error;
    }

    await replaceLocalTable(tableName, response.data ?? []);
    pulledTables.push({ tableName, count: response.data?.length ?? 0 });
  }

  const pullTime = new Date().toISOString();
  syncStore().setLastPullAt(pullTime);
  await refreshQueueCount();
  await writeSystemLog('SYNC_PULL', {
    user_id: actor?.id ?? null,
    user_name: actor?.name ?? 'System',
    pulledTables
  });

  return { pulledTables, pulledAt: pullTime };
}

async function applyRemoteChange(tableName, payload) {
  const table = db.table(tableName);

  if (payload.eventType === 'DELETE') {
    const key = payload.old?.id ?? payload.old?.local_id;
    if (key != null) {
      await table.delete(key);
    }
  } else if (payload.new) {
    const key = getRecordPrimaryKey(tableName, payload.new);
    if (key != null) {
      await table.put(payload.new);
    }
  }

  await refreshQueueCount();
}

export async function startRealtimeSync() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    syncStore().setListenerActive(false);
    return false;
  }

  if (realtimeChannel) {
    return true;
  }

  realtimeChannel = supabase.channel('mumtaz-medical-realtime');

  for (const tableName of SYNC_TABLES) {
    realtimeChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName
      },
      async (payload) => {
        await applyRemoteChange(tableName, payload);
      }
    );
  }

  realtimeChannel.subscribe((status) => {
    syncStore().setListenerActive(status === 'SUBSCRIBED');
  });

  await writeSystemLog('SYNC_LISTENER_START', { user_name: 'System' });
  return true;
}

export async function stopRealtimeSync() {
  const supabase = getSupabaseClient();
  if (supabase && realtimeChannel) {
    await supabase.removeChannel(realtimeChannel);
  }
  realtimeChannel = null;
  syncStore().setListenerActive(false);
  await writeSystemLog('SYNC_LISTENER_STOP', { user_name: 'System' });
}

export async function runManualSync({ actor } = {}) {
  const config = getSupabaseConfigInfo();
  syncStore().setConfigured(config.configured);

  if (!config.configured) {
    const errorMessage = 'Supabase environment variables are missing.';
    syncStore().setLastError(errorMessage);
    throw new Error(errorMessage);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const errorMessage = 'You are offline. Manual sync requires an internet connection.';
    syncStore().setLastError(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    syncStore().setSyncStatus('syncing');
    await pushLocalToCloud({ actor });
    await pullCloudToLocal({ actor });
    const now = new Date().toISOString();
    syncStore().setLastSyncAt(now);
    syncStore().setSyncStatus('idle');
    return { syncedAt: now };
  } catch (error) {
    syncStore().setLastError(error.message || 'Sync failed.');
    await writeSystemLog('SYNC_ERROR', {
      user_id: actor?.id ?? null,
      user_name: actor?.name ?? 'System',
      message: error.message || 'Sync failed.'
    });
    throw error;
  }
}
