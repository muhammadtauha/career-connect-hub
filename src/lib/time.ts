const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function relativeTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(seconds);
  if (abs < 45) return "just now";
  for (const [unit, size] of UNITS) {
    if (abs >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(Math.round(seconds / 60), "minute");
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
