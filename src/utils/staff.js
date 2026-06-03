export function normalizeStaffId(value = '') {
  return String(value).trim().toUpperCase();
}

export function buildStaffShortCode(name = '') {
  const cleaned = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^a-z0-9]/gi, ''))
    .filter(Boolean);

  if (!cleaned.length) return 'ST';

  const initials = cleaned.map((part) => part[0]).join('').toUpperCase();
  const compact = cleaned.join('').toUpperCase();
  return (initials.length >= 2 ? initials : compact).slice(0, 4) || 'ST';
}

export function generateStaffId(staffRows = []) {
  const maxIndex = staffRows.reduce((highest, member) => {
    const match = String(member.staff_id ?? '').match(/(\d+)$/);
    const value = match ? Number(match[1]) : 0;
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);

  return `STAFF-${String(maxIndex + 1).padStart(3, '0')}`;
}
