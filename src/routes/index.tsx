import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Menu, MoveUpRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExperiencePanels, navigation, type Panel } from '@/components/ExperiencePanels';
import hero from '@/assets/hero.png.asset.json';
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
  const [stage, setStage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [sceneInteracted, setSceneInteracted] = useState(false);
  const openPanel = useCallback((next: Panel) => { setPanel(next); setMenuOpen(false); if (next === 'tour') setStage(2); }, []);
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
  useEffect(() => {
    if (panel) return;
    let last = 0;
    function onWheel(event: WheelEvent) {
      if (Math.abs(event.deltaY) < 10 || Date.now() - last < 800) return;
      last = Date.now();
      setStage(s => Math.max(0, Math.min(3, s + (event.deltaY > 0 ? 1 : -1))));
      setSceneInteracted(true);
    }
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [panel]);
  return <main className="experience">
    <div className="scene-layer" onPointerDown={() => setSceneInteracted(true)}>
      {webgl === true ? <Suspense fallback={<img className="scene-fallback" src={hero.url} alt="The Style Van mobile beauty suite" />}><StyleScene stage={stage} onUnavailable={() => setWebgl(false)} /></Suspense> : <img className="scene-fallback" src={webgl === false ? twilight.url : hero.url} alt="The Style Van and its luxury beauty trailer" />}
    </div>
    {webgl === true && <img className={`scene-poster ${stage > 0 || sceneInteracted ? 'scene-poster-hidden' : ''}`} src={hero.url} alt="" aria-hidden="true" />}
    <div className="scene-tint" />
    <header className="site-header">
      <Button variant="brand" className="brand-lockup" onClick={() => { setPanel(null); setStage(0); }} aria-label="The Style Van home">
        <span className="brand-name">THE STYLE VAN</span><span className="brand-tag">Beauty on the way</span>
      </Button>
      <nav className="desktop-nav" aria-label="Main navigation">{navigation.filter(item => item.id !== 'booking').map(item => <Button key={item.id} variant="nav" onClick={() => openPanel(item.id)}>{item.label}</Button>)}</nav>
      <div className="header-actions"><Button variant="headerBook" onClick={() => openPanel('booking')}>Book online <ArrowUpRight size={15} /></Button><Button variant="mobileMenu" size="icon" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</Button></div>
    </header>
    {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map((item,i) => <Button key={item.id} variant="mobileNav" onClick={() => openPanel(item.id)}><span>0{i+1}</span>{item.label}<ArrowUpRight size={17} /></Button>)}</nav>}
    <div className="hero-copy"><div className="hero-eyebrow"><span className="eyebrow-line" /> THE SALON COMES TO YOU <span className="eyebrow-line" /></div><h1>THE STYLE VAN</h1><p className="script-line">Beauty on the way</p><p className="hero-description">An extraordinary beauty experience, wherever the moment takes you.</p><div className="hero-buttons"><Button variant="hero" onClick={() => openPanel('booking')}>Book your experience <MoveUpRight size={17} /></Button><Button variant="heroOutline" onClick={() => openPanel('tour')}>Explore the van <ArrowUpRight size={17} /></Button></div></div>
    <div className="bottom-rail"><span className="rail-index">0{stage + 1} <span>/</span> 04</span><div className="rail-caption"><span className="rail-dash" /> {['THE ARRIVAL','A CLOSER LOOK','STEP INSIDE','THE EXPERIENCE'][stage]}</div><Button variant="scrollHint" onClick={() => { setSceneInteracted(true); setStage(s => (s + 1) % 4); }}>SCROLL TO EXPLORE <ArrowDown size={15} /></Button></div>
    <div className="side-rail"><span>AN EXPERIENCE IN MOTION</span><span>✦</span><span>EST. FOR YOUR MOMENT</span></div>
    <ExperiencePanels panel={panel} onClose={closePanel} onOpen={openPanel} />
  </main>;
}
