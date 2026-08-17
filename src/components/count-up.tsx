import { useEffect, useRef, useState } from "react";

/**
 * Display-only number animation: counts from 0 to `value` on mount/change.
 * Non-numeric values render unchanged.
 */
export function CountUp({ value, duration = 700 }: { value: string | number; duration?: number }) {
  const numeric = typeof value === "number" ? value : Number(value);
  const isNumeric = typeof value === "number" || (value.trim() !== "" && !Number.isNaN(numeric));
  const [display, setDisplay] = useState(isNumeric ? 0 : 0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!isNumeric) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(numeric);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (numeric - from) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [numeric, isNumeric, duration]);

  if (!isNumeric) return <>{value}</>;
  return <>{display}</>;
}
