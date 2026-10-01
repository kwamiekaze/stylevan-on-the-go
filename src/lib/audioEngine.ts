/**
 * One shared audio output for everything on the page: the ambient soundscape, the key fob chirp and the awning effects.
 *
 * Why this exists: on iPhones and iPads, Web Audio follows the ring/silent switch, so sounds stay silent unless a Bluetooth
 * speaker or headphones are connected. To make sound play on the phone's own speaker by default we
 *   1. ask Safari for a "playback" audio session (the same category a music or video player uses), and
 *   2. on iOS, send the whole mix through a hidden <audio> element, which is treated as media and ignores the silent switch.
 * Everywhere else the mix goes straight to the speakers. All sounds also obey the single sound on/off toggle.
 */
type Engine = { ctx: AudioContext; out: GainNode };
let engine: Engine | null = null;
let element: HTMLAudioElement | null = null;
let muted = false;
try { muted = localStorage.getItem('sv-sound') === 'off'; } catch { /* private mode */ }

const isIOS = () => typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function getAudio(): Engine | null {
  if (engine) return engine;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try { const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession; if (s) s.type = 'playback'; } catch { /* not supported */ }
  const ctx = new AC();
  const out = ctx.createGain(); out.gain.value = muted ? 0 : 1;
  if (isIOS() && typeof ctx.createMediaStreamDestination === 'function') {
    const dest = ctx.createMediaStreamDestination(); out.connect(dest);
    element = document.createElement('audio'); element.srcObject = dest.stream; element.setAttribute('playsinline', ''); element.autoplay = true; element.style.display = 'none';
    document.body.appendChild(element);
  } else out.connect(ctx.destination);
  engine = { ctx, out };
  return engine;
}

/** Call from a tap, click, key press or the end of a swipe. Returns true once sound is really playing. */
export async function unlockAudio(): Promise<boolean> {
  const a = getAudio(); if (!a) return false;
  try { await a.ctx.resume(); } catch { /* needs a gesture */ }
  if (element && element.paused) { try { await element.play(); } catch { /* needs a gesture */ } }
  return a.ctx.state === 'running';
}

export function setEngineMuted(m: boolean) { muted = m; if (engine) engine.out.gain.setTargetAtTime(m ? 0 : 1, engine.ctx.currentTime, m ? .12 : .3); }
export const engineMuted = () => muted;
