import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronDown, ChevronUp, Lock, LockOpen, Menu, Moon, MoveUpRight, Play, Sun, Volume2, VolumeX, X } from 'lucide-react';
import { chirp } from '@/components/scene/lights';
import { awning as sfxAwning } from '@/lib/sfx';
import { soundscape } from '@/lib/soundscape';
import { captionAt, TOUR_LENGTH } from '@/components/scene/cinema';
import { Button } from '@/components/ui/button';
import { ExperiencePanels, navigation, type Panel } from '@/components/ExperiencePanels';
import twilight from '@/assets/twilight.png.asset.json';
import { Journey } from '@/components/journey/Journey';
import { isNightNow, msUntilSwitch } from '@/lib/dayNight';
import { useSoundscape } from '@/hooks/useSoundscape';
import { CONTACT, callHref } from '@/config/contact';

const StyleScene = lazy(() => import('@/components/StyleScene').then(module => ({ default: module.StyleScene })));

export function HomePage({ splash, onSceneReady }: { splash: boolean; onSceneReady?: () => void }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [stage, setStage] = useState(() => { if (typeof window === 'undefined') return 0; const q = Number(new URLSearchParams(window.location.search).get('stage')); return Number.isFinite(q) ? Math.max(0, Math.min(4, q)) : 0; });
  const q0 = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const [tour, setTour] = useState(() => q0.get('tour') === '1');
  const [tourT, setTourT] = useState(0);
  const tourStart = Number(q0.get('tt') ?? 0) || 0;
  const [locked, setLocked] = useState(() => q0.get('open') !== '1');
  const [flash, setFlash] = useState({ n: 0, times: 1 });
  const doLock = useCallback(() => { setLocked(true); setFlash(f => ({ n: f.n + 1, times: 1 })); chirp(1); sfxAwning(false, .35); }, []);
  const doUnlock = useCallback(() => { setLocked(false); setFlash(f => ({ n: f.n + 1, times: 2 })); chirp(2); sfxAwning(true, .55); }, []);
  const startTour = useCallback(() => { setPanel(null); setLocked(l => { if (l) { setFlash(f => ({ n: f.n + 1, times: 2 })); chirp(2); sfxAwning(true, .55); } return false; }); setTour(true); }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signIn, setSignIn] = useState(false);
  // The brand in the header reloads the whole homepage from the top, so every panel, scroll position and scene resets.
  const goHome = useCallback(() => { try { window.history.scrollRestoration = 'manual'; } catch { /* older browsers */ } window.scrollTo(0, 0); if (window.location.pathname === '/' && !window.location.search && !window.location.hash) window.location.reload(); else window.location.assign('/'); }, []);
  const goAbout = useCallback(() => { setMenuOpen(false); setPanel(null); setTour(false); document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' }); }, []);
  const goSignIn = useCallback(() => { setMenuOpen(false); setPanel(null); if (CONTACT.portalUrl) window.open(CONTACT.portalUrl, '_blank', 'noopener'); else setSignIn(true); }, []);
  // Day from 7 am to 7 pm, night after that, by the visitor's clock. The theme button overrides it for the rest of the visit.
  const chosen = useRef(false);
  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    if (typeof window === 'undefined') return 'day';
    const q = new URLSearchParams(window.location.search).get('theme'); if (q === 'night' || q === 'day') { chosen.current = true; return q; }
    try { const saved = window.sessionStorage.getItem('sv-theme'); if (saved === 'night' || saved === 'day') { chosen.current = true; return saved; } } catch { /* storage blocked */ }
    return isNightNow() ? 'night' : 'day';
  });
  useEffect(() => {
    let timer = 0;
    const arm = () => { timer = window.setTimeout(() => { if (!chosen.current) setTheme(isNightNow() ? 'night' : 'day'); arm(); }, msUntilSwitch()); };
    arm(); return () => window.clearTimeout(timer);
  }, []);
  const { on: soundOn, toggle: toggleSound } = useSoundscape(theme);
  const toggleTheme = useCallback(() => { chosen.current = true; setTheme(t => { const n = t === 'day' ? 'night' : 'day'; try { window.sessionStorage.setItem('sv-theme', n); } catch { /* ignore */ } return n; }); }, []);
  const heroRef = useRef<HTMLElement>(null);
  const [heroActive, setHeroActive] = useState(true);
  useEffect(() => { const el = heroRef.current; if (!el) return; const io = new IntersectionObserver(([e]) => setHeroActive(e.isIntersecting), { threshold: 0 }); io.observe(el); return () => io.disconnect(); }, []);
  useEffect(() => { soundscape.setZone(heroActive ? 'scene' : 'journey'); }, [heroActive]);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [sceneInteracted, setSceneInteracted] = useState(false);
  // With a phone number set, every "book" button places the call instead of opening a form.
  const openPanel = useCallback((next: Panel) => { if (next === 'booking' && callHref) { window.location.href = callHref; return; } setTour(false); setPanel(next); setMenuOpen(false); if (next === 'tour') setStage(2); }, []);
  const closePanel = useCallback(() => setPanel(null), []);
  useEffect(() => {
    try { const canvas = document.createElement('canvas'); setWebgl(Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))); }
    catch { setWebgl(false); }
  }, []);
  useEffect(() => { if (webgl === false) onSceneReady?.(); }, [webgl, onSceneReady]);   // no 3D on this device: nothing to wait for
  useEffect(() => {
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') { setPanel(null); setMenuOpen(false); setSignIn(false); } }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <>
  <main ref={heroRef} className={`experience ${tour ? 'touring' : ''} ${q0.get('clean') === '1' ? 'clean' : ''}`} data-theme={theme}>
    <div className="scene-layer" onPointerDown={() => setSceneInteracted(true)}>
      {webgl === true ? <Suspense fallback={<div className="scene-loading" />}><StyleScene active={heroActive && !splash} onReady={onSceneReady} stage={stage} theme={theme} open={!locked} flash={flash} tour={tour} tourStart={tourStart} skipIntro={q0.get('stage') !== null || tour} onTourTime={setTourT} onTourEnd={() => setTour(false)} onUnavailable={() => setWebgl(false)} /></Suspense> : webgl === false ? <img className="scene-fallback" src={twilight.url} alt="The Style Van and its luxury beauty trailer" /> : <div className="scene-loading" />}
    </div>
    <div className="scene-tint" />
    <header className="site-header">
      <Button variant="brand" className="brand-lockup" onClick={goHome} aria-label="The Style Van home">
        <span className="brand-name">THE STYLE VAN</span><span className="brand-tag">Beauty on the way</span>
      </Button>
      <nav className="desktop-nav" aria-label="Main navigation">{navigation.filter(item => item.id !== 'booking').map(item => <Button key={item.id} variant="nav" onClick={() => openPanel(item.id)}>{item.label}</Button>)}</nav>
      <div className="header-actions"><button type="button" className="theme-toggle" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}>{soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button><button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'day' ? 'Switch to night' : 'Switch to day'}>{theme === 'day' ? <Moon size={18} /> : <Sun size={18} />}</button><button type="button" className="theme-toggle menu-trigger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
    </header>
    {menuOpen && <nav className="mobile-nav" aria-label="Main menu">
      <button type="button" className="menu-item menu-primary" onClick={() => openPanel('booking')}><span><b>Book now</b><small>Beauty, on the way to you</small></span><ArrowUpRight size={18} /></button>
      <button type="button" className="menu-item" onClick={goSignIn}><span><b>Sign in</b><small>Your style portal</small></span><ArrowUpRight size={18} /></button>
      <button type="button" className="menu-item" onClick={goAbout}><span><b>About</b><small>A salon at your door</small></span><ArrowDown size={18} /></button>
      <button type="button" className="menu-item" onClick={() => openPanel('contact')}><span><b>Contact us</b><small>Get in touch</small></span><ArrowUpRight size={18} /></button>
      <p className="menu-label">Explore</p>
      <div className="menu-explore">{navigation.filter(item => item.id !== 'booking' && item.id !== 'contact' && item.id !== 'gallery').map(item => <button key={item.id} type="button" onClick={() => openPanel(item.id)}>{item.label}</button>)}</div>
    </nav>}
    {signIn && <div className="panel-layer" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSignIn(false); }}><div className="glass-panel signin-panel" role="dialog" aria-modal="true" aria-labelledby="signin-h">
      <div className="panel-topline"><span className="eyebrow">THE STYLE VAN <span className="eyebrow-dot">✦</span> BEAUTY ON THE WAY</span><button type="button" className="signin-close" aria-label="Close" onClick={() => setSignIn(false)}><X size={18} /></button></div>
      <h2 id="signin-h" className="signin-title">Sign in</h2>
      <p className="signin-text">Your style portal is on its way. Until it opens, just give us a call and we’ll take it from there.</p>
      <div className="signin-actions"><button type="button" className="j-btn" onClick={() => { setSignIn(false); openPanel('booking'); }}>{callHref ? `Call ${CONTACT.display}` : 'Book now'} <ArrowUpRight size={17} /></button><button type="button" className="signin-link" onClick={() => { setSignIn(false); openPanel('contact'); }}>Contact us</button></div>
    </div></div>}
    <div className="hero-copy"><div className="hero-eyebrow"><span className="eyebrow-line" /> PICTURE THE SALON AT YOUR DOOR <span className="eyebrow-line" /></div><h1>THE STYLE VAN</h1><p className="script-line">Beauty on the way</p><p className="hero-description">An extraordinary beauty experience, wherever the moment takes you.</p></div>
    <div className="hero-actions"><Button variant="hero" onClick={() => openPanel('booking')}>Book your experience <MoveUpRight size={17} /></Button><Button variant="heroOutline" onClick={startTour}><Play size={15} fill="currentColor" /> Play the tour</Button></div>
    <div className="fob" role="group" aria-label="Van key fob"><span className="fob-state">{locked ? 'LOCKED' : 'UNLOCKED'}</span><div className="fob-body"><button type="button" className={`fob-btn ${locked ? 'fob-on' : ''}`} onClick={doLock} aria-label="Lock the van and trailer"><Lock size={18} /></button><button type="button" className={`fob-btn ${!locked ? 'fob-on' : ''}`} onClick={doUnlock} aria-label="Unlock the van and trailer"><LockOpen size={18} /></button></div></div>
    <div className="bottom-rail"><div className="rail-caption"><span className="rail-dash" /><span className="rail-stage">{['THE ARRIVAL','A CLOSER LOOK','STEP INSIDE','THE EXPERIENCE'][stage]}</span><span className="rail-swipe">SWIPE UP · BEAUTY IS ON THE WAY</span></div><Button variant="scrollHint" onClick={() => { setSceneInteracted(true); setStage(s => (s + 1) % 4); }}>NEXT VIEW <ArrowDown size={15} /></Button>
      <div className="swipe-hint" role="button" tabIndex={0} aria-label="Swipe up to see more of the page" onClick={() => window.scrollTo({ top: window.innerHeight * .9, behavior: 'smooth' })} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.scrollTo({ top: window.innerHeight * .9, behavior: 'smooth' }); }}><span>SWIPE</span><ChevronUp size={12} strokeWidth={2.5} /><ChevronDown size={12} strokeWidth={2.5} /></div></div>
    <div className="drag-hint">DRAG TO ORBIT · SCROLL TO ZOOM</div>
    <div className="side-rail"><span>AN EXPERIENCE IN MOTION</span><span>✦</span><span>EST. FOR YOUR MOMENT</span></div>
    {tour && <><div className="letterbox letterbox-top" />
      <div className="tour-hud"><div className="tour-caption" key={captionAt(tourT).title}><span className="tour-kicker">THE STYLE VAN</span><strong>{captionAt(tourT).title}</strong><em>{captionAt(tourT).sub}</em></div>
        <div className="tour-progress"><span style={{ width: `${Math.min(100, (tourT / TOUR_LENGTH) * 100)}%` }} /></div>
        <button type="button" className="tour-exit" onClick={() => setTour(false)}><X size={15} /> Exit tour</button></div></>}
    <ExperiencePanels panel={panel} onClose={closePanel} onOpen={openPanel} />
  </main>
  <Journey theme={theme} onBook={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => openPanel('booking'), 450); }} soundOn={soundOn} onSound={toggleSound} onTheme={toggleTheme} />
  </>;
}
