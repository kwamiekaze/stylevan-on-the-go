import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const KEY = 'sv-splash-seen';

/** Show the splash video once per browser session, and never for reduced-motion visitors or when the link has ?splash=0. */
export function shouldShowSplash(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).get('splash') === '0') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.sessionStorage.getItem(KEY)) return false;
  } catch { /* storage blocked: still show it */ }
  return true;
}

/**
 * Full-screen splash: the Style Van video plays muted (browsers block sound before a tap), then fades into the site.
 * The site (the heavy 3D scene) starts loading 0.5 s after the video starts playing, so it is ready by the time the video ends. Skip and sound buttons stay within reach, and the splash
 * never traps anyone: if the video cannot start or stalls, it dismisses itself.
 */
export function SplashVideo({ onDone, onLoadSite }: { onDone: () => void; onLoadSite: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const done = useRef(false);
  const startGuard = useRef(0);
  const siteTimer = useRef(0);
  const cb = useRef({ onDone, onLoadSite });
  cb.current = { onDone, onLoadSite };                                   // always call the latest callbacks without restarting the timers
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(true);

  const finish = useCallback(() => {
    if (done.current) return; done.current = true;
    try { window.sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setLeaving(true);
    cb.current.onLoadSite();                                              // in case the video never started: load the site now
    window.setTimeout(() => cb.current.onDone(), 650);
  }, []);

  useEffect(() => {
    const html = document.documentElement, prev = html.style.overflow; html.style.overflow = 'hidden';
    const v = video.current;
    if (v) { const p = v.play(); if (p) p.catch(() => finish()); }       // autoplay refused: go straight to the site
    startGuard.current = window.setTimeout(finish, 8000);                // the video never started playing (slow network): move on
    const hardStop = window.setTimeout(finish, 16000);                   // absolute ceiling, the clip is only 4.4 s long
    return () => { html.style.overflow = prev; window.clearTimeout(startGuard.current); window.clearTimeout(siteTimer.current); siteTimer.current = 0; window.clearTimeout(hardStop); };
  }, [finish]);

  return <div className={`splash ${leaving ? 'splash-leave' : ''}`} role="dialog" aria-label="The Style Van intro">
    <video ref={video} className="splash-video" muted={muted} playsInline autoPlay preload="auto" poster="/splash/style-van-splash-poster.jpg"
      onPlaying={() => { window.clearTimeout(startGuard.current); if (!siteTimer.current) siteTimer.current = window.setTimeout(() => cb.current.onLoadSite(), 500); }} onEnded={finish} onError={e => { if (e.target === e.currentTarget) finish(); }} onClick={finish}>
      <source src="/splash/style-van-splash.mp4" type="video/mp4" />
      {/* one source failing is fine, the next is tried; only when the last one fails too does the splash give up */}
      <source src="/splash/style-van-splash.webm" type="video/webm" onError={finish} />
    </video>
    <button type="button" className="splash-sound" aria-label={muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={!muted}
      onClick={() => { const v = video.current; setMuted(m => { const n = !m; if (v) { v.muted = n; if (!n) void v.play().catch(() => undefined); } return n; }); }}>
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
    <button type="button" className="splash-skip" onClick={finish}>SKIP</button>
  </div>;
}
