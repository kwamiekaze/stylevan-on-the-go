import * as THREE from 'three';
import { createContext } from 'react';

/** 0..1 pulse for the key fob light show. */
export const FlashCtx = createContext<{ current: number }>({ current: 0 });

/** Shared by the van and trailer so one driver animates every lamp at once. */
export const headMat = new THREE.MeshStandardMaterial({ color: '#fff8e6', emissive: '#ffe2a8', emissiveIntensity: 1.6 });
export const signalMat = new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff9a1a', emissiveIntensity: .25 });
export const tailMat = new THREE.MeshStandardMaterial({ color: '#c72f45', emissive: '#ff3b57', emissiveIntensity: 1.3 });

/** Short two tone chirp like a real key fob. Safe to call after a user gesture. */
export function chirp(times: number) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 1900; g.gain.value = 0;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * .26;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .01); g.gain.setValueAtTime(.05, t + .09); g.gain.linearRampToValueAtTime(0, t + .11);
      o.start(t); o.stop(t + .13);
    }
    setTimeout(() => ctx.close(), 900);
  } catch { /* audio is optional */ }
}
