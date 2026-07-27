export function formatCurrency(value: number | string, currency?: string): string {
  const num = Number(value) || 0;
  const formatted = num
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return currency ? `${formatted} ${currency}` : formatted;
}
