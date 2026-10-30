"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up from the previous value to `value` with an ease-out curve. */
export function AnimatedNumber({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const currentRef = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    if (reduceMotion || from === value) {
      setDisplay(value);
      fromRef.current = currentRef.current = value;
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      currentRef.current = Math.round(from + (value - from) * eased);
      setDisplay(currentRef.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      // An interrupted count resumes from wherever it had reached
      cancelAnimationFrame(frame);
      fromRef.current = currentRef.current;
    };
  }, [value, duration]);

  return <span className={`tabular-nums ${className ?? ""}`}>{display.toLocaleString()}</span>;
}
