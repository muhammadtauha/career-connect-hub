/**
 * Presentation-only helpers: deterministic accent palettes and stagger delays.
 * No data logic lives here.
 */

const TAG_TONES = [
  "border-chart-1/30 bg-chart-1/10 text-chart-1",
  "border-chart-2/30 bg-chart-2/10 text-chart-2",
  "border-chart-3/30 bg-chart-3/10 text-chart-3",
  "border-chart-4/30 bg-chart-4/10 text-chart-4",
  "border-chart-5/30 bg-chart-5/10 text-chart-5",
] as const;

const STAT_TONES = [
  { icon: "bg-chart-1/15 text-chart-1", bar: "bg-chart-1" },
  { icon: "bg-chart-2/15 text-chart-2", bar: "bg-chart-2" },
  { icon: "bg-chart-3/15 text-chart-3", bar: "bg-chart-3" },
  { icon: "bg-chart-4/15 text-chart-4", bar: "bg-chart-4" },
  { icon: "bg-chart-5/15 text-chart-5", bar: "bg-chart-5" },
] as const;

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function tagTone(value: string) {
  return TAG_TONES[hash(value.toLowerCase()) % TAG_TONES.length];
}

export function statTone(value: string) {
  return STAT_TONES[hash(value.toLowerCase()) % STAT_TONES.length];
}

/** Inline style producing a staggered load-in delay for list items. */
export function stagger(index: number, step = 50, max = 12) {
  return { animationDelay: `${Math.min(index, max) * step}ms` };
}
