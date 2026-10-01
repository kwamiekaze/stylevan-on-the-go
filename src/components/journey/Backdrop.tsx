import { useEffect, useMemo, useRef } from 'react';
import { rng } from '@/components/scene/theme';
import './backdrop.css';

/*
 * The living world behind the whole journey. It is a sticky, viewport sized stage, so as you scroll the page
 * the sky travels from sunrise to dusk (or deepens at night), the sun with its sunglasses (or the moon) crosses
 * the sky, clouds and skylines slide by at different speeds, beauty tools drift upward, balloons rise, doves
 * cross and petals fall. Each service stop also tints the whole scene in its own mood.
 */
type Theme = 'day' | 'night';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
type Key = { p: number; top: string; bottom: string };
const DAY: Key[] = [{ p: 0, top: '#ffe3cf', bottom: '#ffc9d4' }, { p: .22, top: '#c3e5ff', bottom: '#fff1e4' }, { p: .5, top: '#90ccff', bottom: '#e4f3ff' }, { p: .75, top: '#ffd3a0', bottom: '#ffb9a6' }, { p: 1, top: '#f5bfd6', bottom: '#d7b6ea' }];
const NIGHT: Key[] = [{ p: 0, top: '#1b1230', bottom: '#3b2152' }, { p: .5, top: '#0f1738', bottom: '#2a2050' }, { p: 1, top: '#0a0d2a', bottom: '#2c1642' }];
function sky(keys: Key[], p: number) { let i = 0; while (i < keys.length - 2 && p > keys[i + 1].p) i++; const a = keys[i], b = keys[i + 1]; const t = clamp((p - a.p) / (b.p - a.p), 0, 1); return [mix(a.top, b.top, t), mix(a.bottom, b.bottom, t)]; }

function city(seed: number, base: number, minH: number, maxH: number, lit: boolean) {
  const r = rng(seed); let x = 0, d = `M0 ${base} `; const wins: { x: number; y: number }[] = [];
  while (x < 1600) {
    const w = 34 + r() * 68, h = minH + r() * (maxH - minH), top = base - h;
    d += `L${x} ${top} `; if (r() > .8) d += `L${x + w * .5} ${top - 14 - r() * 18} `; d += `L${x + w} ${top} `;
    if (lit) for (let k = 0; k < 7; k++) if (r() > .45) wins.push({ x: x + 6 + (k % 3) * (w / 3.4), y: top + 10 + Math.floor(k / 3) * 17 });
    x += w + r() * 8;
  }
  return { d: d + `L1600 ${base} Z`, wins };
}

const ICONS: Record<string, string> = {
  scissors: 'M14 12 L34 36 M34 12 L14 36 M8 40 a5 5 0 1 0 0.1 0 M40 40 a5 5 0 1 0 0.1 0',
  comb: 'M6 18 H42 V28 H6 Z M10 28 V38 M16 28 V38 M22 28 V38 M28 28 V38 M34 28 V38 M40 28 V38',
  polish: 'M17 22 H31 V40 a3 3 0 0 1 -3 3 H20 a3 3 0 0 1 -3 -3 Z M21 22 V8 H27 V22',
  lipstick: 'M14 42 H34 V28 H14 Z M17 28 V18 H31 V28 M17 18 L31 10',
  mirror: 'M24 4 a14 14 0 1 0 0.1 0 M24 32 V44 M19 44 H29',
  heart: 'M24 40 C6 28 8 12 18 12 C22 12 24 15 24 17 C24 15 26 12 30 12 C40 12 42 28 24 40 Z',
  sparkle: 'M24 4 L28 20 L44 24 L28 28 L24 44 L20 28 L4 24 L20 20 Z',
  flower: 'M24 24 m-4 -10 a5 5 0 1 0 8 0 a5 5 0 1 0 -8 0 M32 20 a5 5 0 1 1 3 9 M13 24 a5 5 0 1 1 3 9 M19 34 a5 5 0 1 1 10 0',
  lashes: 'M6 30 Q24 14 42 30 Q24 44 6 30 Z M10 22 L6 14 M18 18 L16 8 M24 16 V6 M30 18 L32 8 M38 22 L42 14',
  brush: 'M10 40 L30 20 M30 20 L38 8 L40 10 L28 24 M8 42 q-2 -6 4 -8 q6 -2 6 4 q-4 6 -10 4',
};
const FLOATERS = [['scissors', 6, .12, .55], ['heart', 14, .62, .8], ['comb', 22, .34, .6], ['sparkle', 31, .91, 1.1], ['polish', 40, .2, .7], ['lashes', 48, .74, .9], ['flower', 57, .46, .65], ['lipstick', 66, .05, .85], ['mirror', 75, .58, .6], ['brush', 83, .28, .75], ['heart', 91, .83, .55], ['scissors', 96, .4, .9], ['sparkle', 10, .96, .7], ['polish', 88, .68, 1]] as const;
const BALLOONS = [[7, 30, '#f0b9bd', 0], [19, 38, '#e6c48a', 6], [34, 28, '#fff6ee', 12], [55, 42, '#d9707f', 3], [68, 34, '#f0b9bd', 17], [82, 26, '#e6c48a', 9], [93, 40, '#fff6ee', 21]] as const;

export function Backdrop({ theme, active }: { theme: Theme; active: number }) {
  const root = useRef<HTMLDivElement>(null), themeRef = useRef(theme);
  themeRef.current = theme;
  const far = useMemo(() => city(7, 260, 60, 150, false), []), near = useMemo(() => city(19, 260, 40, 110, true), []);
  const stars = useMemo(() => { const r = rng(5); return Array.from({ length: 70 }).map(() => ({ x: r() * 100, y: r() * 62, s: 1 + r() * 2.2, d: r() * 6 })); }, []);
  const bulbs = useMemo(() => Array.from({ length: 46 }).map((_, i) => { const t = i / 45, seg = Math.floor(t * 3), u = (t * 3) % 1; return { x: t * 1200, y: 8 + Math.sin(u * Math.PI) * 38 + (seg === 1 ? 0 : 0), c: i % 3 }; }), []);

  useEffect(() => {
    const el = root.current!, host = el.closest('.journey') as HTMLElement; let raf = 0;
    const q = (s: string) => el.querySelector<HTMLElement>(s)!, qa = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(s));
    const skyEl = q('.bd-sky'), orb = q('.bd-orb'), farC = q('.bd-clouds.far'), nearC = q('.bd-clouds.near'), farCity = q('.bd-city.far'), nearCity = q('.bd-city.near'), hills = q('.bd-hills'), floats = qa('.bd-float > span');
    const update = () => {
      raf = 0; const r = host.getBoundingClientRect(), vh = window.innerHeight, p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      const [t, b] = sky(themeRef.current === 'night' ? NIGHT : DAY, p); skyEl.style.background = `linear-gradient(180deg, ${t}, ${b})`;
      orb.style.transform = `translate3d(${8 + 84 * p}vw, ${80 - Math.sin(Math.PI * p) * 62}svh, 0) translate(-50%, -50%)`;
      farC.style.transform = `translate3d(${-p * 240}px,0,0)`; nearC.style.transform = `translate3d(${-p * 560}px,0,0)`;
      farCity.style.transform = `translate3d(${-p * 70}px,0,0)`; nearCity.style.transform = `translate3d(${-p * 160}px,0,0)`; hills.style.transform = `translate3d(${-p * 300}px,0,0)`;
      floats.forEach(f => { const base = Number(f.dataset.b), sp = Number(f.dataset.s); const y = ((base - p * sp * 7) % 1 + 1) % 1; f.style.transform = `translate3d(0, ${y * 112 - 6}svh, 0) rotate(${p * sp * 540}deg)`; f.style.opacity = String(Math.min(1, y * 7, (1 - y) * 7) * .34); });
    };
    const onS = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onS, { passive: true }); window.addEventListener('resize', onS); update();
    return () => { window.removeEventListener('scroll', onS); window.removeEventListener('resize', onS); cancelAnimationFrame(raf); };
  }, [theme]);

  const cloud = (k: number, cls: string) => <svg key={k} className={cls} viewBox="0 0 240 100" aria-hidden="true"><path d="M30 86 C6 86 4 56 28 54 C28 30 62 22 76 42 C90 14 134 18 140 48 C170 34 204 52 194 74 C210 76 212 88 196 90 L40 90 Z" /></svg>;
  return <div className="bd" data-theme={theme} ref={root} aria-hidden="true">
    <div className="bd-sky" />
    <div className="bd-stars">{stars.map((s, i) => <span key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />)}</div>
    <div className="bd-orb">
      <svg className="sun" viewBox="0 0 200 200"><g className="sun-rays">{Array.from({ length: 16 }).map((_, i) => <path key={i} d="M100 6 L110 34 L90 34 Z" transform={`rotate(${i * 22.5} 100 100)`} />)}</g><circle cx="100" cy="100" r="58" className="sun-disc" />
        <g className="shades"><rect x="52" y="80" width="42" height="28" rx="12" /><rect x="106" y="80" width="42" height="28" rx="12" /><path d="M94 90 H106" /><path d="M52 90 L40 86 M148 90 L160 86" /></g>
        <path d="M76 122 Q100 142 124 122" className="smile" /><circle cx="64" cy="118" r="7" className="cheek" /><circle cx="136" cy="118" r="7" className="cheek" /></svg>
      <svg className="moon" viewBox="0 0 200 200"><circle cx="100" cy="100" r="62" className="moon-disc" /><circle cx="78" cy="84" r="11" /><circle cx="118" cy="112" r="15" /><circle cx="96" cy="136" r="7" /><circle cx="124" cy="76" r="6" /></svg>
    </div>
    <div className="bd-clouds far">{[8, 42, 74].map((l, i) => <span key={i} style={{ left: `${l}%`, top: `${10 + i * 7}%` }}>{cloud(i, 'c')}</span>)}</div>
    <svg className="bd-city far" viewBox="0 0 1600 260" preserveAspectRatio="none"><path d={far.d} /></svg>
    <div className="bd-clouds near">{[0, 28, 56, 84].map((l, i) => <span key={i} style={{ left: `${l}%`, top: `${24 + (i % 2) * 14}%`, transform: 'scale(1.35)' }}>{cloud(i, 'c')}</span>)}</div>
    <svg className="bd-city near" viewBox="0 0 1600 260" preserveAspectRatio="none"><path d={near.d} />{near.wins.map((w, i) => <rect key={i} x={w.x} y={w.y} width="6" height="8" className="win" style={{ animationDelay: `${(i % 9) * .6}s` }} />)}</svg>
    <div className="bd-float">{FLOATERS.map(([n, l, b, s], i) => <span key={i} data-b={b} data-s={s} style={{ left: `${l}%` }}><svg viewBox="0 0 48 48" width={30 + (i % 4) * 9}><path d={ICONS[n]} /></svg></span>)}</div>
    <div className="bd-balloons">{BALLOONS.map(([l, s, c, d], i) => <span key={i} style={{ left: `${l}%`, animationDuration: `${s}s`, animationDelay: `-${d}s` }}><svg viewBox="0 0 60 110" width={i % 2 ? 40 : 52}>{i % 2 ? <path d="M30 70 C0 48 6 14 24 14 C28 14 30 18 30 21 C30 18 32 14 36 14 C54 14 60 48 30 70 Z" fill={c} /> : <ellipse cx="30" cy="34" rx="24" ry="30" fill={c} />}<path d="M30 70 L26 76 H34 Z" fill={c} /><path d="M30 76 C24 90 36 98 30 110" fill="none" stroke="#c39a62" strokeWidth="1.6" /><ellipse cx="22" cy="24" rx="5" ry="9" fill="#fff" opacity=".4" /></svg></span>)}</div>
    <div className="bd-doves">{[0, 1, 2].map(i => <span key={i} style={{ animationDuration: `${30 + i * 7}s`, animationDelay: `-${i * 11}s`, top: `${14 + i * 12}%` }}><svg viewBox="0 0 80 50" width={56 - i * 8}><g className="wings"><path d="M40 26 C28 6 12 8 2 14 C16 18 26 26 34 32 Z" /><path d="M40 26 C52 6 68 8 78 14 C64 18 54 26 46 32 Z" /></g><ellipse cx="40" cy="30" rx="12" ry="8" className="body" /><circle cx="52" cy="26" r="5" className="body" /><path d="M56 26 L62 28 L56 29 Z" fill="#c9b8b0" /><path d="M28 32 L14 40 L30 36 Z" className="body" /></svg></span>)}</div>
    <div className="bd-petals">{Array.from({ length: 22 }).map((_, i) => <span key={i} style={{ left: `${(i * 47) % 100}%`, animationDuration: `${12 + (i % 7) * 2.2}s`, animationDelay: `-${(i * 1.7) % 14}s`, width: 8 + (i % 4) * 3, height: 6 + (i % 3) * 3 }} />)}</div>
    <div className="bd-fireflies">{Array.from({ length: 26 }).map((_, i) => <span key={i} style={{ left: `${(i * 37) % 100}%`, top: `${40 + (i * 23) % 56}%`, animationDuration: `${6 + (i % 6)}s`, animationDelay: `-${(i * 1.3) % 8}s` }} />)}</div>
    <svg className="bd-hills" viewBox="0 0 1600 300" preserveAspectRatio="none"><path className="h1" d="M0 300 V170 C220 90 420 160 640 128 S1020 70 1240 126 S1500 140 1600 100 V300 Z" /><path className="h2" d="M0 300 V222 C260 170 520 230 800 200 S1280 170 1600 214 V300 Z" />
      {[90, 240, 410, 600, 820, 990, 1180, 1370, 1520].map((x, i) => <g key={x} className="tree" transform={`translate(${x} ${i % 2 ? 214 : 190})`}><rect x="-3" y="0" width="6" height="22" /><circle cx="0" cy="-6" r="20" /><circle cx="-13" cy="4" r="14" /><circle cx="13" cy="4" r="14" /></g>)}</svg>
    <svg className="bd-lights" viewBox="0 0 1200 70" preserveAspectRatio="none"><path d="M0 6 C150 70 300 70 400 6 C500 70 700 70 800 6 C900 70 1050 70 1200 6" fill="none" stroke="rgba(60,40,45,.55)" strokeWidth="1.5" />{bulbs.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r="4.5" className={`bulb b${b.c}`} style={{ animationDelay: `${(i % 7) * .35}s` }} />)}</svg>
    {['salon', 'barber', 'nails', 'lashes'].map((k, i) => <div key={k} className={`bd-tint t-${k}`} style={{ opacity: active === i ? 1 : 0 }} />)}
    <div className="bd-fade-top" />
  </div>;
}
