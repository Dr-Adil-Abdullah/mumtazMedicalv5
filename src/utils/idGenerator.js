export function generateCustomerId(index) {
  return `CID-${String(index).padStart(4, '0')}`;
}
