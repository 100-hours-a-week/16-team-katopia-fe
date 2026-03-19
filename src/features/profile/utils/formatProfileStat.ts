export function formatProfileStat(value: number | string) {
  if (typeof value !== "number" || value < 1000) {
    return value;
  }

  const compactValue = value / 1000;
  const formatted = Number.isInteger(compactValue)
    ? String(compactValue)
    : compactValue.toFixed(1).replace(/\.0$/, "");

  return `${formatted}K`;
}
