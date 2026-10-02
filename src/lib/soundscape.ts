/**
 * The Style Van background music: the "Beauty On The Way" track, looped over and over.
 * It plays on its own as soon as the browser allows sound (browsers wait for a first tap, click, key press or scroll),
 * stays quietly under the sound effects, and the sound toggle mutes it. Each pass blends into the next with a three second
 * crossfade, so the loop never clicks or restarts abruptly.
 */
import { getAudio, setEngineMuted, unlockAudio } from './audioEngine';
import { analyzeTrack, type BeatGrid } from './beatgrid';

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
  private an: AnalyserNode | null = null; private fft: Uint8Array | null = null;
  private begun = false; private timer = 0; private nextStart = 0;
  private grid: BeatGrid | null = null; private firstStart = 0; private hop = 0;

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
        .then(b => this.ctx!.decodeAudioData(b)).then(d => { this.buf = d; try { const g = analyzeTrack(d); this.grid = g && g.confidence > .25 ? g : null; } catch { this.grid = null; } this.begin(); })
        .catch(() => { this.loading = null; });
    }
    return this.loading;
  }

  /** Live bass, mid and high energy of the music (0 to 1), read before the mute switch so cuts can follow it. Null when nothing is playing. */
  bands(): { bass: number; mid: number; high: number; level: number } | null {
    if (!this.an || !this.fft || !this.begun || !this.running) return null;
    this.an.getByteFrequencyData(this.fft); const d = this.fft; const avg = (a: number, b: number) => { let s = 0; for (let i = a; i < b; i++) s += d[i]!; return s / ((b - a) * 255); };
    const bass = avg(1, 5), mid = avg(5, 40), high = avg(40, 160);
    return { bass, mid, high, level: (bass + mid + high) / 3 };
  }

  private begin() {
    if (this.begun || !this.buf || !this.ctx) return;
    this.an = this.ctx.createAnalyser(); this.an.fftSize = 1024; this.an.smoothingTimeConstant = .35; this.an.minDecibels = -90; this.an.maxDecibels = 0;   // wide range so loud music never saturates this.fft = new Uint8Array(this.an.frequencyBinCount);
    this.begun = true; this.nextStart = this.ctx.currentTime + .05; this.cycle();
    this.timer = window.setInterval(() => this.tick(), 500);
  }

  /**
   * Schedule one full pass of the track, fading in at the start and out at the end, to overlap the next pass. When the beat grid is
   * known, the next pass starts a whole number of bars after this one, so the two passes beat together through the crossfade and the
   * beat count carries on without a hiccup from one loop to the next.
   */
  private cycle() {
    const c = this.ctx!, buf = this.buf!, d = buf.duration, t = this.nextStart, bar = this.grid?.bar ?? 0;
    const hop = bar ? Math.max(bar, Math.floor((d - FADE) / bar) * bar) : d - FADE, F = d - hop;
    if (!this.hop) { this.hop = hop; this.firstStart = t; }
    const fin = Float32Array.from(fadeIn), fout = Float32Array.from(fadeOut);
    const src = c.createBufferSource(); src.buffer = buf; const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.setValueCurveAtTime(fin, t, F); g.gain.setValueAtTime(LEVEL, t + F + .02); g.gain.setValueCurveAtTime(fout, t + hop, F - .02);
    src.connect(g).connect(this.out!); if (this.an) src.connect(this.an); src.start(t); src.stop(t + d + .1);
    this.nextStart = t + hop;
  }

  /**
   * Where the music is right now, on its beat grid: the beat count since the music began (whole numbers are beats, multiples of four are
   * bar lines), the time into the current pass of the track, and the grid itself. Corrected for the delay between the audio engine and the
   * speaker, so a cut on a bar line lands when the listener hears the downbeat. Null until the music is running and analysed.
   */
  clock(): { beat: number; time: number; grid: BeatGrid } | null {
    const c = this.ctx, g = this.grid; if (!c || !g || !this.begun || !this.hop || c.state !== 'running') return null;
    const lat = (c as unknown as { outputLatency?: number }).outputLatency || c.baseLatency || 0, rel = c.currentTime - lat - this.firstStart;
    if (rel < 0) return null;
    return { beat: (rel - g.offset) / g.beat, time: rel - Math.floor(rel / this.hop) * this.hop, grid: g };
  }

  private tick() {
    const c = this.ctx; if (!c || c.state !== 'running' || !this.buf) return;
    if (c.currentTime + 2 > this.nextStart) this.cycle();
  }
}

export const soundscape = new Soundscape();
