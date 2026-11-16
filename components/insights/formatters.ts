const integerFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export function formatCount(value: number): string {
  return integerFormatter.format(Math.round(value));
}

export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}

export function formatPercent(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${formatDecimal((part / total) * 100)}%`;
}
