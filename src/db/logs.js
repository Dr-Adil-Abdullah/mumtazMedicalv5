import { db } from './index';

export async function writeLog(payload) {
  await db.logs.add({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...payload
  });
}
