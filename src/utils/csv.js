function escapeCsvValue(value) {
  if (value == null) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function toCsv(rows, columns = []) {
  if (!Array.isArray(rows)) return '';

  const resolvedColumns = columns.length
    ? columns
    : Array.from(
        rows.reduce((set, row) => {
          Object.keys(row ?? {}).forEach((key) => set.add(key));
          return set;
        }, new Set())
      ).map((key) => ({ key, label: key }));

  const header = resolvedColumns.map((column) => escapeCsvValue(column.label)).join(',');
  const body = rows.map((row) => resolvedColumns.map((column) => escapeCsvValue(row?.[column.key])).join(',')).join('\n');

  return [header, body].filter(Boolean).join('\n');
}

export function downloadCsv({ filename, rows, columns = [] }) {
  const csv = toCsv(rows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
