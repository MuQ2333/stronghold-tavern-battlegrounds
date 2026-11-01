// Display only: calculations and tooltips retain the exact stack count.
export function formatLayerCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n > 999) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
