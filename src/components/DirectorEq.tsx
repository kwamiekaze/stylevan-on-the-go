import { useEffect, useRef } from 'react';
import { soundscape } from '@/lib/soundscape';

/** Five little bars that dance with the music, so people can see the cuts following the beat. */
export function DirectorEq() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0, last = 0; const bars = Array.from(ref.current?.children ?? []) as HTMLElement[]; const v = [0, 0, 0, 0, 0];
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick); if (t - last < 40) return; last = t;
      const b = soundscape.bands(); const src = b ? [b.bass * 1.6, b.bass + b.mid * .6, b.mid * 1.5, b.mid + b.high, b.high * 3] : [.18, .3, .22, .3, .16];
      bars.forEach((el, i) => { v[i] = (v[i] ?? 0) + (Math.min(1, src[i] ?? 0) - (v[i] ?? 0)) * .5; el.style.transform = `scaleY(${.18 + (v[i] ?? 0) * .82})`; });
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, []);
  return <span className="eq" ref={ref} aria-hidden="true"><i /><i /><i /><i /><i /></span>;
}
