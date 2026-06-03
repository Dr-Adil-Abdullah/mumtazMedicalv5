export function formatCurrency(amount, currency = 'Rs.') {
  const numeric = Number(amount || 0);
  return `${currency} ${numeric.toFixed(2)}/-`;
}
