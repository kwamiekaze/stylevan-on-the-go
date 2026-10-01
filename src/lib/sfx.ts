import { getAudio, unlockAudio } from './audioEngine';

/* Short sound effects, all generated live. Each one is skipped if sound is off or the browser has not unlocked audio yet. */
let noise: AudioBuffer | null = null;
function noiseBuf(ctx: AudioContext) {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return noise;
}
let busFor: { ctx: AudioContext; node: GainNode } | null = null;
/** All effects share one quieter bus, so they sit comfortably above the ambience without startling anyone. */
function bus(ctx: AudioContext, out: AudioNode) { if (busFor && busFor.ctx === ctx) return busFor.node; const g = ctx.createGain(); g.gain.value = .48; g.connect(out); busFor = { ctx, node: g }; return g; }
function ready() { const a = getAudio(); if (!a) return null; if (a.ctx.state !== 'running') { void unlockAudio(); return null; } return a; }

/** Latch click and a small thump, the sound of something settling into place. */
function latch(ctx: AudioContext, out: AudioNode, t: number, gain = 1) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2200; const g = ctx.createGain();
  g.gain.setValueAtTime(.3 * gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + .035); n.connect(hp).connect(g).connect(out); n.start(t); n.stop(t + .05);
  const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(58, t + .12);
  og.gain.setValueAtTime(.3 * gain, t); og.gain.exponentialRampToValueAtTime(.0001, t + .16); o.connect(og).connect(out); o.start(t); o.stop(t + .18);
  const m = ctx.createOscillator(), mg = ctx.createGain(); m.type = 'triangle'; m.frequency.value = 340; mg.gain.setValueAtTime(.08 * gain, t); mg.gain.exponentialRampToValueAtTime(.0001, t + .09); m.connect(mg).connect(out); m.start(t); m.stop(t + .1);   // mid tone so small phone speakers carry it
}

/** The awning arm unfolding (or folding away): a gentle motor, fabric sweeping, then a soft latch. Opening ends with a sparkle. */
export function awning(open: boolean, delay = 0) {
  const a = ready(); if (!a) return; const ctx = a.ctx, out = bus(ctx, a.out); const t0 = ctx.currentTime + delay + .03, D = .9;
  const lo = open ? [62, 118] : [118, 62], hi = open ? [240, 470] : [470, 240], band = open ? [600, 2800] : [2800, 520];
  const motor = ctx.createOscillator(), mf = ctx.createBiquadFilter(), mg = ctx.createGain(); motor.type = 'sawtooth'; mf.type = 'lowpass'; mf.frequency.value = 460;
  motor.frequency.setValueAtTime(lo[0], t0); motor.frequency.linearRampToValueAtTime(lo[1], t0 + D);
  mg.gain.setValueAtTime(0, t0); mg.gain.linearRampToValueAtTime(.1, t0 + .1); mg.gain.setValueAtTime(.1, t0 + D - .12); mg.gain.linearRampToValueAtTime(0, t0 + D);
  motor.connect(mf).connect(mg).connect(out); motor.start(t0); motor.stop(t0 + D + .05);
  const whine = ctx.createOscillator(), wg = ctx.createGain(); whine.type = 'triangle'; whine.frequency.setValueAtTime(hi[0], t0); whine.frequency.linearRampToValueAtTime(hi[1], t0 + D);
  wg.gain.setValueAtTime(0, t0); wg.gain.linearRampToValueAtTime(.04, t0 + .1); wg.gain.linearRampToValueAtTime(0, t0 + D); whine.connect(wg).connect(out); whine.start(t0); whine.stop(t0 + D + .05);
  const fabric = ctx.createBufferSource(); fabric.buffer = noiseBuf(ctx); fabric.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(band[0], t0); bp.frequency.exponentialRampToValueAtTime(band[1], t0 + D); const fg = ctx.createGain();
  fg.gain.setValueAtTime(0, t0); fg.gain.linearRampToValueAtTime(.2, t0 + .22); fg.gain.linearRampToValueAtTime(0, t0 + D); fabric.connect(bp).connect(fg).connect(out); fabric.start(t0); fabric.stop(t0 + D + .05);
  latch(ctx, out, t0 + D - .03, open ? 1 : .8);
  if (open) [[1760, .06, .1], [2349, .04, .2]].forEach(([f, v, dt]) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; const t = t0 + D + dt;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.3); o.connect(g).connect(out); o.start(t); o.stop(t + 1.4);
  });
}

type Drive = { osc: OscillatorNode; osc2: OscillatorNode; g: GainNode; ng: GainNode };
let drive: Drive | null = null, lastDrive = 0;
/** A soft engine and road hum that follows how fast the van is rolling, 0 (parked) to 1 (cruising). */
export function driveSpeed(v: number) {
  const now = performance.now(); if (v > 0 && now - lastDrive < 90) return; lastDrive = now;
  const a = getAudio(); if (!a || a.ctx.state !== 'running') return; const ctx = a.ctx, out = bus(ctx, a.out);
  if (!drive) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 190; const g = ctx.createGain(); g.gain.value = 0; lp.connect(g).connect(out);
    const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 52; osc.connect(lp); osc.start();
    const osc2 = ctx.createOscillator(); osc2.type = 'triangle'; osc2.frequency.value = 156; const g2 = ctx.createGain(); g2.gain.value = .3; osc2.connect(g2).connect(lp); osc2.start();
    const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx); n.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 220; bp.Q.value = .8; const ng = ctx.createGain(); ng.gain.value = 0; n.connect(bp).connect(ng).connect(out); n.start();
    drive = { osc, osc2, g, ng };
  }
  const t = ctx.currentTime; drive.g.gain.setTargetAtTime(v * .05, t, .25); drive.ng.gain.setTargetAtTime(v * .035, t, .3);
  drive.osc.frequency.setTargetAtTime(50 + v * 36, t, .3); drive.osc2.frequency.setTargetAtTime(150 + v * 108, t, .3);
}
