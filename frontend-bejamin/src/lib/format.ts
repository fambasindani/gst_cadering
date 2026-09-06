export function formatCurrency(value: number | string, currency?: string): string {
  const num = Number(value) || 0;
  const formatted = num
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return currency ? `${formatted} ${currency}` : formatted;
}

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function generateCodePreview(name: string): string {
  const slug = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const now = new Date();
  const week = String(getISOWeek(now)).padStart(3, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${slug}/${week}/${month}/${year}`;
}
