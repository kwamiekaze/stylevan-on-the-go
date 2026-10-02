import { useCallback, useEffect, useRef, useState } from 'react';
import { soundscape, type SoundTheme } from '@/lib/soundscape';

/**
 * Background music: OFF every time the page loads (the header icon shows muted). It starts only when the visitor taps the sound
 * icon, and the same icon mutes it again. Nothing is remembered between visits.
 */
export function useSoundscape(theme: SoundTheme) {
  const [on, setOn] = useState(false);
  const onRef = useRef(on), themeRef = useRef(theme);
  onRef.current = on; themeRef.current = theme;

  useEffect(() => {
    let cleaned = false;
    const gestures = ['pointerdown', 'click', 'keydown', 'touchstart', 'touchend', 'wheel', 'scroll'] as const;
    const unlock = () => { if (onRef.current) soundscape.start(false, themeRef.current).then(ok => { if (ok) detach(); }); else detach(); };
    const detach = () => { if (cleaned) return; gestures.forEach(g => window.removeEventListener(g, unlock)); };
    if (onRef.current) soundscape.start(false, themeRef.current).then(ok => { if (!ok) gestures.forEach(g => window.addEventListener(g, unlock, { passive: true })); });
    return () => { cleaned = true; gestures.forEach(g => window.removeEventListener(g, unlock)); };
  }, []);

  useEffect(() => { soundscape.setTheme(theme); }, [theme]);

  const toggle = useCallback(() => {
    const next = !onRef.current; setOn(next);
    if (next) soundscape.start(false, themeRef.current); else soundscape.setMuted(true);
  }, []);

  return { on, toggle };
}
