import { db } from './index';

export async function enqueueSync({ tableName, action, recordId, data }) {
  return db.sync_queue.add({
    tableName,
    action,
    recordId,
    data,
    status: 'pending',
    retries: 0,
    timestamp: Date.now()
  });
}
