import { useEffect, useRef } from 'react';

/**
 * The scrolling "places" ribbon. Every word is its own small element moved with its own transform and recycled as it
 * leaves the screen, so there is never one enormous layer to repaint. Phones can drop pieces of a very wide animated
 * layer, which showed up as missing letters at the edge of the ribbon. Same pace as before: one full set every 46 s.
 */
export function Marquee({ items, seconds = 46 }: { items: readonly string[]; seconds?: number }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.marquee-item'));
    const n = items.length;
    let raf = 0, last = 0, shift = 0, set = 0, widths: number[] = [], base: number[] = [], total = 0, copies = 0, visible = true, alive = true;

    const measure = () => {
      widths = nodes.map(nd => nd.offsetWidth);
      set = widths.slice(0, n).reduce((a, b) => a + b, 0) || 1;
      copies = Math.max(2, Math.ceil(el.clientWidth / set) + 1);                 // enough copies to always fill the screen
      total = set * copies;
      base = nodes.map((_, k) => { const i = k % n, c = Math.floor(k / n); let o = c * set; for (let j = 0; j < i; j++) o += widths[j]!; return o; });
      nodes.forEach((nd, k) => { nd.style.visibility = k < n * copies ? 'visible' : 'hidden'; });
      draw();
    };
    const draw = () => {
      for (let k = 0; k < nodes.length; k++) {
        if (k >= n * copies) break;
        let x = base[k]! - shift; x = ((x % total) + total) % total; if (x > total - (widths[k] ?? 0)) x -= total;   // wrap around
        nodes[k]!.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      }
    };
    const tick = (t: number) => {
      raf = 0; if (!alive) return;
      const dt = last ? Math.min(.1, (t - last) / 1000) : 0; last = t;
      shift = (shift + (set / seconds) * dt) % total; draw();
      if (visible && !document.hidden) raf = requestAnimationFrame(tick); else last = 0;
    };
    const start = () => { if (!reduce && !raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };

    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (visible) start(); }, { rootMargin: '200px' });
    io.observe(el);
    const ro = new ResizeObserver(() => { measure(); start(); }); ro.observe(el);
    const onVis = () => start(); document.addEventListener('visibilitychange', onVis);
    void document.fonts.ready.then(() => { if (alive) { measure(); start(); } });
    measure(); start();
    return () => { alive = false; if (raf) cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, [items, seconds]);

  // Enough word elements for the widest screens (up to 6 sets); extras stay hidden until the layout needs them.
  const sets = 6, list = Array.from({ length: items.length * sets }, (_, k) => items[k % items.length]);
  return <div className="marquee" aria-hidden="true">
    <div className="marquee-track" ref={box}>
      <span className="marquee-sizer">Ag</span>
      {list.map((p, k) => <span className="marquee-item" key={k}>{p}<i>✦</i></span>)}
    </div>
  </div>;
}
