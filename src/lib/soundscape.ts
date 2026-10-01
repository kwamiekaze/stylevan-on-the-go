/**
 * The Style Van background music: the "Beauty On The Way" track, looped over and over.
 * It plays on its own as soon as the browser allows sound (browsers wait for a first tap, click, key press or scroll),
 * stays quietly under the sound effects, and the sound toggle mutes it. Each pass blends into the next with a three second
 * crossfade, so the loop never clicks or restarts abruptly.
 */
import { getAudio, setEngineMuted, unlockAudio } from './audioEngine';

export type SoundTheme = 'day' | 'night';
export type SoundZone = 'scene' | 'journey';

const TRACK = '/audio/beauty-on-the-way.mp3';
const LEVEL = .24;                 // the master is loud (about -14 LUFS), so it sits well below the effects
const FADE = 3;                    // seconds of crossfade between one pass and the next
const fadeIn = Float32Array.from({ length: 64 }, (_, i) => Math.sin((i / 63) * Math.PI / 2) * LEVEL);
const fadeOut = Float32Array.from({ length: 64 }, (_, i) => Math.cos((i / 63) * Math.PI / 2) * LEVEL);

class Soundscape {
  private ctx: AudioContext | null = null; private out: AudioNode | null = null;
  private buf: AudioBuffer | null = null; private loading: Promise<void> | null = null;
  private begun = false; private timer = 0; private nextStart = 0;

  get running() { return this.ctx?.state === 'running'; }

  async start(muted: boolean, _theme?: SoundTheme): Promise<boolean> {
    setEngineMuted(muted);
    const a = getAudio(); if (!a) return false;
    this.ctx = a.ctx; this.out = a.out;
    void this.load();
    await unlockAudio();
    this.begin();
    return this.running;
  }

  setMuted(m: boolean) { setEngineMuted(m); }
  setTheme(_t: SoundTheme) { /* the same track plays day and night */ }
  setZone(_z: SoundZone) { /* and in the 3D scene and the journey */ }

  private load(): Promise<void> {
    if (this.buf) return Promise.resolve();
    if (!this.loading) {
      this.loading = fetch(TRACK).then(r => { if (!r.ok) throw new Error('track missing'); return r.arrayBuffer(); })
        .then(b => this.ctx!.decodeAudioData(b)).then(d => { this.buf = d; this.begin(); })
        .catch(() => { this.loading = null; });
    }
    return this.loading;
  }

  private begin() {
    if (this.begun || !this.buf || !this.ctx) return;
    this.begun = true; this.nextStart = this.ctx.currentTime + .05; this.cycle();
    this.timer = window.setInterval(() => this.tick(), 500);
  }

  /** Schedule one full pass of the track, fading in at the start and out at the end, to overlap the next pass. */
  private cycle() {
    const c = this.ctx!, buf = this.buf!, d = buf.duration, t = this.nextStart;
    const src = c.createBufferSource(); src.buffer = buf; const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.setValueCurveAtTime(fadeIn, t, FADE); g.gain.setValueAtTime(LEVEL, t + FADE); g.gain.setValueCurveAtTime(fadeOut, t + d - FADE, FADE);
    src.connect(g).connect(this.out!); src.start(t); src.stop(t + d + .1);
    this.nextStart = t + d - FADE;
  }

  private tick() {
    const c = this.ctx; if (!c || c.state !== 'running' || !this.buf) return;
    if (c.currentTime + 2 > this.nextStart) this.cycle();
  }
}

export const soundscape = new Soundscape();
