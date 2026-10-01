import { useCallback, useEffect, useRef, useState } from 'react';
import { soundscape, type SoundTheme } from '@/lib/soundscape';

const KEY = 'sv-sound';

/** Ambient sound: on by default, remembers a visitor's choice to mute, and waits for the first gesture if the browser blocks autoplay. */
export function useSoundscape(theme: SoundTheme) {
  const [on, setOn] = useState(() => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } });
  const onRef = useRef(on), themeRef = useRef(theme);
  onRef.current = on; themeRef.current = theme;

  useEffect(() => {
    let cleaned = false;
    const gestures = ['pointerdown', 'keydown', 'touchend', 'wheel', 'scroll'] as const;
    const unlock = () => { if (onRef.current) soundscape.start(false, themeRef.current).then(ok => { if (ok) detach(); }); else detach(); };
    const detach = () => { if (cleaned) return; gestures.forEach(g => window.removeEventListener(g, unlock)); };
    if (onRef.current) soundscape.start(false, themeRef.current).then(ok => { if (!ok) gestures.forEach(g => window.addEventListener(g, unlock, { passive: true })); });
    return () => { cleaned = true; gestures.forEach(g => window.removeEventListener(g, unlock)); };
  }, []);

  useEffect(() => { soundscape.setTheme(theme); }, [theme]);

  const toggle = useCallback(() => {
    const next = !onRef.current; setOn(next);
    try { localStorage.setItem(KEY, next ? 'on' : 'off'); } catch { /* private mode */ }
    if (next) soundscape.start(false, themeRef.current); else soundscape.setMuted(true);
  }, []);

  return { on, toggle };
}
