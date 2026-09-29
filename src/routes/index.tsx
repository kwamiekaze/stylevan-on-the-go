import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Lock, LockOpen, Menu, Moon, MoveUpRight, Play, Sun, X, ChevronUp, ChevronDown } from 'lucide-react';
import { chirp } from '@/components/scene/lights';
import { captionAt, TOUR_LENGTH } from '@/components/scene/cinema';
import { Button } from '@/components/ui/button';
import { ExperiencePanels, navigation, type Panel } from '@/components/ExperiencePanels';
import twilight from '@/assets/twilight.png.asset.json';

const StyleScene = lazy(() => import('@/components/StyleScene').then(module => ({ default: module.StyleScene })));

export const Route = createFileRoute('/')({
  ssr: false,
  head: () => ({ meta: [
    { title: 'The Style Van | Beauty on the way' },
    { name: 'description', content: 'A luxury mobile beauty salon for salon, barber, nails, lashes, bridal and events. The Style Van brings the experience to you.' },
    { property: 'og:title', content: 'The Style Van | Beauty on the way' },
    { property: 'og:description', content: 'Luxury beauty, wherever life takes you. Explore the van, discover the services, and request your appointment.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Home,
});

function Home() {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [stage, setStage] = useState(() => { if (typeof window === 'undefined') return 0; const q = Number(new URLSearchParams(window.location.search).get('stage')); return Number.isFinite(q) ? Math.max(0, Math.min(4, q)) : 0; });
  const q0 = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const [tour, setTour] = useState(() => q0.get('tour') === '1');
  const [tourT, setTourT] = useState(0);
  const tourStart = Number(q0.get('tt') ?? 0) || 0;
  const [locked, setLocked] = useState(() => q0.get('open') !== '1');
  const [flash, setFlash] = useState({ n: 0, times: 1 });
  const doLock = useCallback(() => { setLocked(true); setFlash(f => ({ n: f.n + 1, times: 1 })); chirp(1); }, []);
  const doUnlock = useCallback(() => { setLocked(false); setFlash(f => ({ n: f.n + 1, times: 2 })); chirp(2); }, []);
  const startTour = useCallback(() => { setPanel(null); setLocked(l => { if (l) { setFlash(f => ({ n: f.n + 1, times: 2 })); chirp(2); } return false; }); setTour(true); }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'day' | 'night'>(() => { if (typeof window === 'undefined') return 'day'; const q = new URLSearchParams(window.location.search).get('theme'); if (q === 'night' || q === 'day') return q; const h = new Date().getHours(); return h >= 19 || h < 6 ? 'night' : 'day'; });
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [sceneInteracted, setSceneInteracted] = useState(false);
  const openPanel = useCallback((next: Panel) => { setTour(false); setPanel(next); setMenuOpen(false); if (next === 'tour') setStage(2); }, []);
  const closePanel = useCallback(() => setPanel(null), []);
  useEffect(() => {
    try { const canvas = document.createElement('canvas'); setWebgl(Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))); }
    catch { setWebgl(false); }
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') { setPanel(null); setMenuOpen(false); } }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <main className={`experience ${tour ? 'touring' : ''} ${q0.get('clean') === '1' ? 'clean' : ''}`} data-theme={theme}>
    <div className="scene-layer" onPointerDown={() => setSceneInteracted(true)}>
      {webgl === true ? <Suspense fallback={<div className="scene-loading" />}><StyleScene stage={stage} theme={theme} open={!locked} flash={flash} tour={tour} tourStart={tourStart} skipIntro={q0.get('stage') !== null || tour} onTourTime={setTourT} onTourEnd={() => setTour(false)} onUnavailable={() => setWebgl(false)} /></Suspense> : webgl === false ? <img className="scene-fallback" src={twilight.url} alt="The Style Van and its luxury beauty trailer" /> : <div className="scene-loading" />}
    </div>
    <div className="scene-tint" />
    <header className="site-header">
      <Button variant="brand" className="brand-lockup" onClick={() => { setPanel(null); setStage(0); }} aria-label="The Style Van home">
        <span className="brand-name">THE STYLE VAN</span><span className="brand-tag">Beauty on the way</span>
      </Button>
      <nav className="desktop-nav" aria-label="Main navigation">{navigation.filter(item => item.id !== 'booking').map(item => <Button key={item.id} variant="nav" onClick={() => openPanel(item.id)}>{item.label}</Button>)}</nav>
      <div className="header-actions"><button type="button" className="theme-toggle" onClick={() => setTheme(t => t === 'day' ? 'night' : 'day')} aria-label={theme === 'day' ? 'Switch to night' : 'Switch to day'}>{theme === 'day' ? <Moon size={18} /> : <Sun size={18} />}</button><Button variant="headerBook" onClick={() => openPanel('booking')}>Book online <ArrowUpRight size={15} /></Button><Button variant="mobileMenu" size="icon" className="menu-trigger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</Button></div>
    </header>
    {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map((item,i) => <Button key={item.id} variant="mobileNav" onClick={() => openPanel(item.id)}><span>0{i+1}</span>{item.label}<ArrowUpRight size={17} /></Button>)}</nav>}
    <div className="hero-copy"><div className="hero-eyebrow"><span className="eyebrow-line" /> THE SALON COMES TO YOU <span className="eyebrow-line" /></div><h1>THE STYLE VAN</h1><p className="script-line">Beauty on the way</p><p className="hero-description">An extraordinary beauty experience, wherever the moment takes you.</p></div>
    <div className="hero-actions"><Button variant="hero" onClick={() => openPanel('booking')}>Book your experience <MoveUpRight size={17} /></Button><Button variant="heroOutline" onClick={startTour}><Play size={15} fill="currentColor" /> Play the tour</Button></div>
    <div className="fob" role="group" aria-label="Van key fob"><span className="fob-state">{locked ? 'LOCKED' : 'UNLOCKED'}</span><div className="fob-body"><button type="button" className={`fob-btn ${locked ? 'fob-on' : ''}`} onClick={doLock} aria-label="Lock the van and trailer"><Lock size={18} /></button><button type="button" className={`fob-btn ${!locked ? 'fob-on' : ''}`} onClick={doUnlock} aria-label="Unlock the van and trailer"><LockOpen size={18} /></button></div></div>
    <div className="bottom-rail"><span className="rail-index">0{stage + 1} <span>/</span> 04</span><div className="rail-caption"><span className="rail-dash" /> {['THE ARRIVAL','A CLOSER LOOK','STEP INSIDE','THE EXPERIENCE'][stage]}</div><Button variant="scrollHint" onClick={() => { setSceneInteracted(true); setStage(s => (s + 1) % 4); }}>NEXT VIEW <ArrowDown size={15} /></Button><div className="swipe-hint" aria-hidden="true"><span>SWIPE</span><ChevronUp className="swipe-up" size={12} strokeWidth={2.2} /><ChevronDown className="swipe-down" size={12} strokeWidth={2.2} /></div></div>
    <div className="drag-hint">DRAG TO ORBIT · SCROLL TO ZOOM</div>
    <div className="side-rail"><span>AN EXPERIENCE IN MOTION</span><span>✦</span><span>EST. FOR YOUR MOMENT</span></div>
    {tour && <><div className="letterbox letterbox-top" /><div className="letterbox letterbox-bottom" />
      <div className="tour-hud"><div className="tour-caption" key={captionAt(tourT).title}><span className="tour-kicker">THE STYLE VAN</span><strong>{captionAt(tourT).title}</strong><em>{captionAt(tourT).sub}</em></div>
        <div className="tour-progress"><span style={{ width: `${Math.min(100, (tourT / TOUR_LENGTH) * 100)}%` }} /></div>
        <button type="button" className="tour-exit" onClick={() => setTour(false)}><X size={15} /> Exit tour</button></div></>}
    <ExperiencePanels panel={panel} onClose={closePanel} onOpen={openPanel} />
  </main>;
}
