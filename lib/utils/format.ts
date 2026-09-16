export function formatNumber(num: number | null, prefix = "", suffix = ""): string {
  if (num == null) return "—";
  if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B${suffix}`;
  if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M${suffix}`;
  if (num >= 1e3) return `${prefix}${(num / 1e3).toFixed(2)}K${suffix}`;
  return `${prefix}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
}

export function formatLargeNumber(num: number | null, prefix = ""): string {
  if (num == null) return "—";
  if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${prefix}${(num / 1e3).toFixed(1)}K`;
  return `${prefix}${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatTokenAmount(raw: string, decimals: number): string {
  const num = Number(raw) / Math.pow(10, decimals);
  if (num === 0) return "0";
  if (num < 0.001) return num.toExponential(2);
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatPrice(price: number | null): string {
  if (price == null) return "—";
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
