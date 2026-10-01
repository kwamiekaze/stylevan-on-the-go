import * as THREE from 'three';
import { createContext } from 'react';
import { getAudio, unlockAudio } from '@/lib/audioEngine';

/** 0..1 pulse for the key fob light show. */
export const FlashCtx = createContext<{ current: number }>({ current: 0 });

/** Shared by the van and trailer so one driver animates every lamp at once. */
export const headMat = new THREE.MeshStandardMaterial({ color: '#fff8e6', emissive: '#ffe2a8', emissiveIntensity: 1.6 });
export const signalMat = new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff9a1a', emissiveIntensity: .25 });
export const tailMat = new THREE.MeshStandardMaterial({ color: '#c72f45', emissive: '#ff3b57', emissiveIntensity: 1.3 });

/** Short two tone chirp and a lock clunk, like a real key fob. Plays on the phone speaker, with or without Bluetooth. Safe to call after a user gesture. */
export function chirp(times: number) {
  const a = getAudio(); if (!a) return;
  void unlockAudio().then(ok => {
    if (!ok) return; const { ctx, out } = a; const t0 = ctx.currentTime + .02;
    for (let i = 0; i < times; i++) {
      const t = t0 + i * .26;
      ([[1900, .06, 'square'], [2400, .035, 'triangle']] as const).forEach(([f, v, type]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.setValueAtTime(v, t + .09); g.gain.linearRampToValueAtTime(0, t + .11); o.connect(g).connect(out); o.start(t); o.stop(t + .13);
      });
    }
    const c = ctx.createOscillator(), cg = ctx.createGain(); c.type = 'sine'; c.frequency.setValueAtTime(150, t0); c.frequency.exponentialRampToValueAtTime(70, t0 + .1);
    cg.gain.setValueAtTime(.16, t0); cg.gain.exponentialRampToValueAtTime(.0001, t0 + .14); c.connect(cg).connect(out); c.start(t0); c.stop(t0 + .16);
  });
}
