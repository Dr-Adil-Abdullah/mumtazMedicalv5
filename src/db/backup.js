import { db } from './index';

const BACKUP_TABLES = [
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

function buildQueueItems(tables) {
  const items = [];
  const timestamp = Date.now();

  for (const tableName of BACKUP_TABLES) {
    if (tableName === 'logs') continue;

    for (const record of tables[tableName] ?? []) {
      items.push({
        tableName,
        action: 'UPSERT',
        recordId: record.id ?? `${tableName}-singleton`,
        data: record,
        status: 'pending',
        retries: 0,
        timestamp
      });
    }
  }

  return items;
}

export async function buildBackupPayload() {
  const tables = {};

  for (const tableName of BACKUP_TABLES) {
    tables[tableName] = await db.table(tableName).toArray();
  }

  return {
    meta: {
      app: 'Mumtaz Medical',
      version: '0.1.0',
      exportedAt: new Date().toISOString(),
      tableCount: BACKUP_TABLES.length
    },
    tables
  };
}

export async function downloadBackupJSON(filename = `mumtaz-medical-backup-${new Date().toISOString().slice(0, 10)}.json`) {
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return payload;
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Backup file is invalid.');
  }

  if (!payload.tables || typeof payload.tables !== 'object') {
    throw new Error('Backup file does not contain table data.');
  }

  for (const tableName of BACKUP_TABLES) {
    if (!Array.isArray(payload.tables[tableName])) {
      throw new Error(`Backup file is missing table: ${tableName}`);
    }
  }

  return true;
}

export async function restoreBackupPayload(payload, actor = {}) {
  validateBackupPayload(payload);

  const {
    settings,
    staff,
    products,
    product_batches,
    customers,
    suppliers,
    sales,
    expenses,
    purchase_list,
    logs,
    partial_payments,
    day_sessions
  } = payload.tables;

  const restoreTimestamp = new Date().toISOString();
  const queueItems = buildQueueItems(payload.tables);

  await db.transaction(
    'rw',
    db.settings,
    db.staff,
    db.products,
    db.product_batches,
    db.customers,
    db.suppliers,
    db.sales,
    db.expenses,
    db.purchase_list,
    db.logs,
    db.partial_payments,
    db.day_sessions,
    db.sync_queue,
    async () => {
      await db.sync_queue.clear();

      await db.settings.clear();
      if (settings.length) await db.settings.bulkPut(settings);

      await db.staff.clear();
      if (staff.length) await db.staff.bulkPut(staff);

      await db.products.clear();
      if (products.length) await db.products.bulkPut(products);

      await db.product_batches.clear();
      if (product_batches.length) await db.product_batches.bulkPut(product_batches);

      await db.customers.clear();
      if (customers.length) await db.customers.bulkPut(customers);

      await db.suppliers.clear();
      if (suppliers.length) await db.suppliers.bulkPut(suppliers);

      await db.sales.clear();
      if (sales.length) await db.sales.bulkPut(sales);

      await db.expenses.clear();
      if (expenses.length) await db.expenses.bulkPut(expenses);

      await db.purchase_list.clear();
      if (purchase_list.length) await db.purchase_list.bulkPut(purchase_list);

      await db.partial_payments.clear();
      if (partial_payments.length) await db.partial_payments.bulkPut(partial_payments);

      await db.day_sessions.clear();
      if (day_sessions.length) await db.day_sessions.bulkPut(day_sessions);

      if (logs.length) await db.logs.bulkPut(logs);

      await db.logs.put({
        id: crypto.randomUUID(),
        action: 'RESTORE',
        user_id: actor.id ?? null,
        user_name: actor.name ?? 'Unknown',
        details: {
          importedAt: restoreTimestamp,
          backupExportedAt: payload.meta?.exportedAt ?? null,
          restoredTables: BACKUP_TABLES.filter((tableName) => tableName !== 'logs'),
          importedLogCount: logs.length
        },
        timestamp: restoreTimestamp
      });

      if (queueItems.length) {
        await db.sync_queue.bulkAdd(queueItems);
      }
    }
  );

  return {
    restoredAt: restoreTimestamp,
    tableCount: BACKUP_TABLES.length,
    queuedRecords: queueItems.length
  };
}
