export function matchesActor(recordUserId, recordUserName, user) {
  if (!user) return false;
  if (user.isEmergency) return !!recordUserName && recordUserName === user.name;
  return recordUserId === user.id || (!!recordUserName && recordUserName === user.name);
}

export function isSaleVisibleToUser(sale, user, canViewAll = false) {
  if (canViewAll) return true;
  return matchesActor(sale?.cashier_id, sale?.cashier_name, user);
}

export function isRecordCreatedByUser(record, user) {
  return matchesActor(record?.created_by, record?.created_by_name, user);
}
