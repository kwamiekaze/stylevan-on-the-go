import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { PLACES, SERVICES, STEPS, type ServiceId } from '@/config/services';
import { ServiceArt, Destination } from './art';
import { Marquee } from './Marquee';
import { Backdrop } from './Backdrop';
import { CONTACT, callHref } from '@/config/contact';
import { awning as sfxAwning } from '@/lib/sfx';
import './journey.css';

type Theme = 'day' | 'night';
type Side = 'left' | 'right';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type Layout = { W: number; H: number; mobile: boolean; scale: number; roadW: number; ys: number[]; xs: number[]; endX: number; endY: number; cardSide: Side[]; d: string };

/** Everything is in pixels. The road runs straight beside each card, then sweeps across the gap to the next stop. */
function computeLayout(W: number): Layout {
  const mobile = W < 820, scale = clamp(W / 900, .6, 1.15), roadW = Math.round(108 * scale);
  const gap = mobile ? 700 : 660, y0 = mobile ? 300 : 340, run = mobile ? 240 : 160;
  const ys = SERVICES.map((_, i) => y0 + i * gap);
  const endY = ys[3] + gap * .92, H = endY + (mobile ? 150 : 210);
  const edge = roadW / 2 + 12;
  const xs = SERVICES.map((_, i) => (mobile ? (i % 2 === 0 ? edge : W - edge) : W / 2 + (i % 2 === 0 ? 1 : -1) * W * .085));
  const endX = W / 2;
  let d = `M ${xs[0]} 0 L ${xs[0]} ${ys[0] + run}`;
  for (let i = 0; i < 3; i++) { const a = ys[i] + run, b = ys[i + 1] - run, m = (a + b) / 2; d += ` C ${xs[i]} ${m}, ${xs[i + 1]} ${m}, ${xs[i + 1]} ${b} L ${xs[i + 1]} ${ys[i + 1] + run}`; }
  const a = ys[3] + run, m = (a + endY) / 2; d += ` C ${xs[3]} ${m}, ${endX} ${m}, ${endX} ${endY}`;
  const cardSide = SERVICES.map((_, i): Side => (mobile ? (i % 2 === 0 ? 'right' : 'left') : (i % 2 === 0 ? 'left' : 'right')));
  return { W, H, mobile, scale, roadW, ys, xs, endX, endY, cardSide, d };
}

/** The Style Van and its trailer from above. Front of the van is +x. */
function VanSprite({ vanRef, trailerRef, hitchRef, awning }: { vanRef: React.RefObject<SVGGElement | null>; trailerRef: React.RefObject<SVGGElement | null>; hitchRef: React.RefObject<SVGLineElement | null>; awning: 'left' | 'right' | 'none' }) {
  return <g data-awning={awning} className="sprite">
    <defs>
      <linearGradient id="sv-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffaf4" /><stop offset="1" stopColor="#f1e3d6" /></linearGradient>
      <linearGradient id="sv-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5d6f80" /><stop offset="1" stopColor="#2d3a47" /></linearGradient>
      <linearGradient id="sv-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff3c8" stopOpacity=".75" /><stop offset="1" stopColor="#fff3c8" stopOpacity="0" /></linearGradient>
      <pattern id="sv-stripes" width="18" height="10" patternUnits="userSpaceOnUse"><rect width="9" height="10" fill="#f0b9bd" /><rect x="9" width="9" height="10" fill="#fff6ee" /></pattern>
    </defs>
    <line ref={hitchRef} stroke="#3a2f33" strokeWidth="5" strokeLinecap="round" />
    <g ref={trailerRef}>
      {[-1, 1].map(s => <g key={s}>{[-30, 6].map(x => <rect key={x} x={x} y={s > 0 ? 22 : -30} width="20" height="8" rx="3" fill="#221d1f" />)}</g>)}
      {(['pos', 'neg'] as const).map(k => <g key={k} transform={k === 'neg' ? 'scale(1,-1)' : undefined}><g className={`awning awning-${k}`}>
        <g className="awning-shape">
          <path d="M -54 24 L 54 24 L 60 70 L -60 70 Z" fill="url(#sv-stripes)" stroke="#c39a62" strokeWidth="2" />
          {[-54, -36, -18, 0, 18, 36, 54].map((x, i) => <circle key={x} cx={x} cy="70" r="9" fill={i % 2 ? '#fff6ee' : '#f0b9bd'} stroke="#c39a62" strokeWidth="1.5" />)}
          <path d="M -58 28 L -58 70 M 58 28 L 58 70" stroke="#c39a62" strokeWidth="2" />
          <rect x="-44" y="30" width="88" height="9" rx="4" fill="#fff" opacity=".35" />
        </g>
      </g></g>)}
      <rect x="-64" y="-25" width="128" height="50" rx="11" fill="url(#sv-body)" stroke="#d9c6b6" strokeWidth="1.5" />
      <path d="M -64 4 C -36 -10, -12 18, 14 4 S 50 -8 64 6 L 64 14 C 50 0, 30 14, 14 14 S -36 4, -64 14 Z" fill="#f0c7c3" opacity=".85" />
      <rect x="-59" y="-20" width="118" height="40" rx="8" fill="none" stroke="#c39a62" strokeWidth="1.3" opacity=".8" />
      <rect x="-56" y="-12" width="26" height="24" rx="5" fill="#efe6dc" stroke="#cdbba9" />
      {[-7, -2, 3, 8].map(y => <line key={y} x1="-52" x2="-34" y1={y} y2={y} stroke="#b9a697" strokeWidth="1.2" />)}
      <text x="18" y="-1" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontWeight="700" fontSize="13" textLength="78" lengthAdjust="spacing" fill="#4e2a35">STYLE VAN</text>
      <text x="18" y="12" textAnchor="middle" fontFamily="'Italianno', cursive" fontSize="13" fill="#4e2a35">Beauty on the way</text>
      <path d="M 64 -8 L 76 0 L 64 8 Z" fill="#3a2f33" />
      {[-1, 1].map(s => <rect key={s} x="-66" y={s > 0 ? 13 : -21} width="4" height="8" rx="1.5" fill="#d1344c" />)}
    </g>
    <g ref={vanRef}>
      {[-1, 1].map(s => <g key={s}>{[-38, 28].map(x => <rect key={x} x={x} y={s > 0 ? 22 : -30} width="20" height="8" rx="3" fill="#221d1f" />)}<rect x="31" y={s > 0 ? 26 : -32} width="8" height="6" rx="3" fill="#221d1f" /></g>)}
      <path className="beam" d="M 58 -14 L 170 -44 L 170 -4 L 58 -4 Z M 58 14 L 170 44 L 170 4 L 58 4 Z" fill="url(#sv-beam)" />
      <rect x="-60" y="-26" width="120" height="52" rx="13" fill="url(#sv-body)" stroke="#d9c6b6" strokeWidth="1.5" />
      <rect x="-55" y="-21" width="110" height="42" rx="9" fill="none" stroke="#c39a62" strokeWidth="1.2" opacity=".8" />
      <rect x="-40" y="-12" width="28" height="24" rx="5" fill="#efe6dc" stroke="#cdbba9" />
      {[-7, -2, 3, 8].map(y => <line key={y} x1="-36" x2="-16" y1={y} y2={y} stroke="#b9a697" strokeWidth="1.2" />)}
      <path d="M 24 -24 L 50 -21 L 54 -19 L 54 19 L 50 21 L 24 24 Z" fill="url(#sv-glass)" />
      <path d="M 29 -20 L 36 -19 L 36 19 L 29 20 Z" fill="#ffffff" opacity=".13" />
      <path d="M 22 -4 L 22 4" stroke="#c39a62" strokeWidth="2" strokeLinecap="round" />
      {[-1, 1].map(s => <g key={s}><rect x="34" y={s > 0 ? 26 : -32} width="9" height="6" rx="3" fill="#1d1a1c" /><circle cx="58" cy={s * 17} r="3.6" fill="#fff6d6" /><circle cx="58" cy={s * 17} r="8" fill="#fff6d6" opacity=".4" className="lamp" /></g>)}
    </g>
  </g>;
}

function Stop({ i, side, top, style, active, onBook }: { i: number; side: Side; top: number; style: React.CSSProperties; active: boolean; onBook: () => void }) {
  const s = SERVICES[i];
  return <article className="stop" data-active={active} data-side={side} style={{ ...style, top }} aria-labelledby={`stop-${s.id}`} id={`stop-card-${s.id}`}>
    <div className="stop-art" aria-hidden="true"><ServiceArt id={s.id as ServiceId} active={active} /></div>
    <div className="stop-copy">
      <h3 id={`stop-${s.id}`}>{s.name}</h3>
      <p className="stop-promise">{s.promise}</p>
      <p className="stop-blurb">{s.blurb}</p>
      <ul>{s.bullets.map(b => <li key={b}>{b}</li>)}</ul>
      <p className="stop-comes"><span>Just one call</span>{s.comesTo}</p>
      {callHref ? <a className="j-btn" href={callHref}>{s.cta} <ArrowUpRight size={17} /></a> : <button type="button" className="j-btn" onClick={onBook}>{s.cta} <ArrowUpRight size={17} /></button>}
    </div>
  </article>;
}

export function Journey({ theme, onBook, soundOn, onSound, onTheme }: { theme: Theme; onBook: () => void; soundOn: boolean; onSound: () => void; onTheme: () => void }) {
  const wrap = useRef<HTMLDivElement>(null), road = useRef<SVGPathElement>(null), trailRef = useRef<SVGGElement>(null);
  const vanRef = useRef<SVGGElement>(null), trailerRef = useRef<SVGGElement>(null), hitchRef = useRef<SVGLineElement>(null), glow = useRef<SVGPathElement>(null);
  const [W, setW] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth));
  const [active, setActive] = useState(-1);                       // -1 none, 0..3 a service stop, 4 home
  const [burst, setBurst] = useState<{ k: number; x: number; y: number } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const L = useMemo(() => computeLayout(W), [W]);
  const samples = useRef<{ x: Float32Array; y: Float32Array; n: number; len: number } | null>(null);
  const st = useRef({ s: 0, t: 0, lastTrail: 0, running: false, active: -1 });

  useEffect(() => { const ro = new ResizeObserver(() => setW(Math.round(wrap.current?.clientWidth ?? window.innerWidth))); if (wrap.current) ro.observe(wrap.current); return () => ro.disconnect(); }, []);

  useEffect(() => {                                                // sample the path once per layout so the frame loop is only lookups
    const p = road.current; if (!p) return; const len = p.getTotalLength(), n = Math.ceil(len / 3) + 1, x = new Float32Array(n), y = new Float32Array(n);
    for (let i = 0; i < n; i++) { const pt = p.getPointAtLength(Math.min(len, i * 3)); x[i] = pt.x; y[i] = pt.y; }
    samples.current = { x, y, n, len };
    if (glow.current) { glow.current.style.strokeDasharray = `${len}`; glow.current.style.strokeDashoffset = `${len}`; }
  }, [L]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0; const trail = Array.from({ length: 16 }, () => ({ x: 0, y: 0, t: -99 })); let ti = 0;
    const io = new IntersectionObserver(([e]) => { st.current.running = e.isIntersecting; if (e.isIntersecting && !raf) raf = requestAnimationFrame(tick); }, { rootMargin: '400px 0px 400px 0px' });
    if (wrap.current) io.observe(wrap.current);
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * .6);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    function at(i: number) { const S = samples.current!; const k = clamp(Math.round(i / 3), 0, S.n - 1); return [S.x[k], S.y[k]] as const; }
    function place(g: SVGGElement | null, s: number, scale: number) {
      const [x, y] = at(s), [ax, ay] = at(s - 9), [bx, by] = at(s + 9); const a = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
      g?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${scale})`); return { x, y, a };
    }
    function tick() {
      raf = 0; const S = samples.current, w = wrap.current; if (!S || !w) { raf = requestAnimationFrame(tick); return; }
      const top = w.getBoundingClientRect().top, vy = window.innerHeight * .56 - top;
      let lo = 0, hi = S.n - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (S.y[m] < vy) lo = m + 1; else hi = m; }
      const target = vy <= 0 ? 0 : Math.min(S.len, lo * 3);
      const now = performance.now(), dt = Math.min(.25, (now - (st.current.t || now)) / 1000); st.current.t = now;
      st.current.s += (target - st.current.s) * (reduce ? 1 : 1 - Math.exp(-dt * 7));
      const s = st.current.s, sc = L.scale, back = 146 * sc;
      const v = place(vanRef.current, s, sc), t = place(trailerRef.current, Math.max(0, s - back), sc);
      const hv = at(s), ht = at(Math.max(0, s - back));
      const ta = t.a * Math.PI / 180, va = v.a * Math.PI / 180;
      if (hitchRef.current) { hitchRef.current.setAttribute('x1', String(ht[0] + Math.cos(ta) * 74 * sc)); hitchRef.current.setAttribute('y1', String(ht[1] + Math.sin(ta) * 74 * sc)); hitchRef.current.setAttribute('x2', String(hv[0] - Math.cos(va) * 60 * sc)); hitchRef.current.setAttribute('y2', String(hv[1] - Math.sin(va) * 60 * sc)); hitchRef.current.setAttribute('stroke-width', String(5 * sc)); }
      if (glow.current) glow.current.style.strokeDashoffset = String(S.len - s);
      if (!reduce && Math.abs(s - st.current.lastTrail) > 26) { st.current.lastTrail = s; const p = at(Math.max(0, s - back - 70 * sc)); trail[ti = (ti + 1) % trail.length] = { x: p[0], y: p[1], t: performance.now() }; }
      if (trailRef.current) Array.from(trailRef.current.children).forEach((c, i) => { const p = trail[i], age = (performance.now() - p.t) / 1500; c.setAttribute('cx', String(p.x)); c.setAttribute('cy', String(p.y - age * 18)); c.setAttribute('opacity', String(Math.max(0, .9 - age))); c.setAttribute('r', String(Math.max(0, (3 + (i % 3)) * (1 - age * .4) * sc * 1.4))); });
      let a = -1; L.ys.forEach((y, i) => { if (Math.abs(v.y - y) < (L.mobile ? 210 : 190)) a = i; }); if (s > S.len - 6) a = 4;
      if (a !== st.current.active) { const prev = st.current.active; if (prev >= 0 && prev !== a) sfxAwning(false); if (a >= 0) sfxAwning(true, prev >= 0 && prev !== a ? .5 : 0); st.current.active = a; setActive(a); if (a >= 0) setBurst({ k: performance.now(), x: v.x, y: v.y }); }
      if (st.current.running) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [L]);

  const goTo = useCallback((i: number) => { const w = wrap.current; if (!w) return; const y = i === 4 ? L.endY : L.ys[i]; window.scrollTo({ top: w.getBoundingClientRect().top + window.scrollY + y - window.innerHeight * .5, behavior: 'smooth' }); }, [L]);
  const awning: 'left' | 'right' | 'none' = active >= 0 && active < 4 ? (L.mobile ? L.cardSide[active] : (L.cardSide[active] === 'left' ? 'right' : 'left')) : (active === 4 ? 'left' : 'none');
  const cardStyle = (side: Side): React.CSSProperties => L.mobile ? (side === 'right' ? { left: L.roadW + 26, right: 14 } : { left: 14, right: L.roadW + 26 }) : (side === 'left' ? { left: '5%', width: 'min(470px, 40%)' } : { right: '5%', width: 'min(470px, 40%)' });

  return <section className="journey" id="journey" data-theme={theme}>
    <Backdrop theme={theme} active={active} />
    <header className="j-intro">
      <p className="j-kicker">WHAT WE DO</p>
      <h2>Picture a salon<br /><em>pulling up</em><br />to your door.</h2>
      <p className="j-lead">Imagine Salon, Barber, Nails and Lashes in one glowing van and trailer, rolling right up to your front door. No driving, no waiting rooms, no rushing. Just the feeling of beauty on the way. Just one call and beauty is on the way.</p>
      <ul className="j-pills" aria-label="Jump to a service">{SERVICES.map((s, i) => <li key={s.id}><button type="button" onClick={() => goTo(i)}><span>{s.number}</span>{s.name}</button></li>)}</ul>
      <p className="j-cue"><ArrowDown size={16} /> Follow the road</p>
    </header>

    <div className="j-road" ref={wrap} style={{ height: L.H }}>
      <svg className="road-svg" width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`} aria-hidden="true">
        <path d={L.d} fill="none" stroke="var(--road-edge)" strokeWidth={L.roadW + 10} strokeLinecap="round" strokeLinejoin="round" />
        <path ref={road} d={L.d} fill="none" stroke="var(--road)" strokeWidth={L.roadW} strokeLinecap="round" strokeLinejoin="round" />
        <path d={L.d} fill="none" stroke="var(--road-dash)" strokeWidth={Math.max(2, 3 * L.scale)} strokeDasharray={`${16 * L.scale} ${18 * L.scale}`} strokeLinecap="round" />
        <path ref={glow} d={L.d} fill="none" stroke="var(--gold)" strokeWidth={Math.max(3, 5 * L.scale)} strokeLinecap="round" opacity=".9" className="road-glow" />
      </svg>
      {!L.mobile && SERVICES.map((s, i) => <Destination key={s.id} id={s.id as ServiceId} style={{ top: L.ys[i], [L.cardSide[i] === 'left' ? 'right' : 'left']: '6%' } as React.CSSProperties} active={active === i} />)}
      {!L.mobile && <Destination id="home" style={{ top: L.endY - 40, right: '14%' }} active={active === 4} />}
      {SERVICES.map((s, i) => <Stop key={s.id} i={i} side={L.cardSide[i]} top={L.ys[i]} style={cardStyle(L.cardSide[i])} active={active === i} onBook={onBook} />)}
      <svg className="van-svg" width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`} aria-hidden="true">
        <g ref={trailRef}>{Array.from({ length: 16 }).map((_, i) => <circle key={i} r="4" fill="#e6c48a" opacity="0" />)}</g>
        <VanSprite vanRef={vanRef} trailerRef={trailerRef} hitchRef={hitchRef} awning={awning} />
      </svg>
      {burst && <div className="burst" key={burst.k} style={{ left: burst.x, top: burst.y }} aria-hidden="true">{Array.from({ length: 14 }).map((_, i) => <span key={i} style={{ ['--a' as string]: `${(i / 14) * 360}deg`, ['--d' as string]: `${46 + (i % 4) * 16}px`, animationDelay: `${(i % 5) * 30}ms` }}>{i % 3 === 0 ? '♥' : '✦'}</span>)}</div>}
      <div className="j-you" style={{ top: L.endY + (L.mobile ? 34 : 118), left: L.mobile ? 0 : undefined, right: L.mobile ? 0 : '14%' }} data-active={active === 4}><span>♥</span> Arrived</div>
    </div>

    <section className="j-steps" aria-labelledby="steps-h">
      <p className="j-kicker">SO EASY</p>
      <h2 id="steps-h">Three steps. That is it.</h2>
      <ol>{STEPS.map(s => <li key={s.n}><span className="step-n">{s.n}</span><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
    </section>

    <section className="j-places" aria-label="Places we come to">
      <p className="j-kicker">PICTURE IT</p>
      <Marquee items={PLACES} />
      <p className="j-places-note">Mornings, evenings, weddings, workdays. Just one call and beauty is on the way.</p>
    </section>

    <section className="j-cta" aria-label="Call us">
      <p className="j-script">Beauty on the way</p>
      <p>Call us and tell us what you have in mind. We’ll take it from there.</p>
      {callHref ? <a className="j-btn j-btn-big" href={callHref}>Call <ArrowUpRight size={20} /></a> : <button type="button" className="j-btn j-btn-big" onClick={onBook}>Start your request <ArrowUpRight size={20} /></button>}
      {callHref && CONTACT.onlineBooking && <p className="j-or">or <button type="button" onClick={onBook}>request online</button></p>}
      <p className="j-small">thestylevan.com</p>
    </section>
    <footer className="j-footer"><span>THE STYLE VAN</span><span>Salon · Barber · Nails · Lashes</span></footer>

    <nav className={`j-chapters ${scrolled ? 'show' : ''}`} aria-label="Service chapters">
      {SERVICES.map((s, i) => <button key={s.id} type="button" aria-current={active === i} onClick={() => goTo(i)}><b>{s.number}</b><span>{s.name}</span></button>)}
    </nav>
    <div className={`j-dock ${scrolled ? 'show' : ''}`}>
      <button type="button" onClick={onSound} aria-pressed={soundOn} aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}>{soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
      <button type="button" onClick={onTheme} aria-label={theme === 'day' ? 'Switch to night' : 'Switch to day'}>{theme === 'day' ? <Moon size={19} /> : <Sun size={19} />}</button>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to the top"><ArrowUp size={19} /></button>
    </div>
  </section>;
}
