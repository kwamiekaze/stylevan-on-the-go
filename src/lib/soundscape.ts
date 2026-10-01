/**
 * The Style Van ambient sound, generated live with the Web Audio API so there is no file to download.
 * Day: fountain water, soft breeze, birdsong, a warm pad and gentle sparkles.
 * Night: fountain water, crickets, a deeper pad and slower sparkles.
 * Browsers only allow sound after a first tap, click, key press or scroll, so start() is retried on that first gesture.
 */
export type SoundTheme = 'day' | 'night';

const PENTATONIC = [880, 988, 1175, 1319, 1480, 1760, 1976, 2349];          // D major pentatonic, bright bells
const CHORDS = [[146.83, 220, 293.66, 369.99], [123.47, 185, 246.94, 369.99], [98, 196, 293.66, 370], [110, 220, 277.18, 329.63]];

class Soundscape {
  private ctx: AudioContext | null = null;
  private master!: GainNode; private day!: GainNode; private night!: GainNode; private padFilter!: BiquadFilterNode; private echo!: GainNode;
  private pad: OscillatorNode[] = [];
  private noise!: AudioBuffer;
  private timer = 0; private theme: SoundTheme = 'day'; private muted = false;
  private nextSparkle = 0; private nextBird = 0; private nextChord = 0; private chord = 0;

  get running() { return this.ctx?.state === 'running'; }

  async start(muted: boolean, theme: SoundTheme): Promise<boolean> {
    this.muted = muted; this.theme = theme;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC(); this.build();
    }
    try { await this.ctx.resume(); } catch { /* needs a gesture first */ }
    this.levels();
    return this.running;
  }

  setMuted(m: boolean) { this.muted = m; this.levels(); }
  setTheme(t: SoundTheme) { this.theme = t; this.levels(); }

  private levels() {
    const c = this.ctx; if (!c) return; const t = c.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : .9, t, this.muted ? .25 : 1.6);
    this.day.gain.setTargetAtTime(this.theme === 'day' ? 1 : 0, t, 1.8);
    this.night.gain.setTargetAtTime(this.theme === 'night' ? 1 : 0, t, 1.8);
    this.padFilter.frequency.setTargetAtTime(this.theme === 'day' ? 1500 : 650, t, 2);
  }

  private noiseSource(loop = true) {
    const s = this.ctx!.createBufferSource(); s.buffer = this.noise; s.loop = loop; s.start(0, Math.random() * 1.5); return s;
  }

  private build() {
    const c = this.ctx!;
    // two seconds of pink noise feeds water, breeze and city hum
    this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = this.noise.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .18; }
    this.master = c.createGain(); this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    this.master.connect(comp).connect(c.destination);
    this.day = c.createGain(); this.day.gain.value = 0; this.day.connect(this.master);
    this.night = c.createGain(); this.night.gain.value = 0; this.night.connect(this.master);
    const always = c.createGain(); always.gain.value = 1; always.connect(this.master);
    // echo bus for bells
    const delay = c.createDelay(1); delay.delayTime.value = .34; const fb = c.createGain(); fb.gain.value = .36; delay.connect(fb).connect(delay);
    this.echo = c.createGain(); this.echo.gain.value = 1; this.echo.connect(always); this.echo.connect(delay); delay.connect(always);
    // fountain: a soft band of water plus fine droplets, both gently swelling
    const w1 = this.noiseSource(), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = .6; const wg = c.createGain(); wg.gain.value = .05;
    w1.connect(bp).connect(wg).connect(always);
    const w2 = this.noiseSource(), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4200; const dg = c.createGain(); dg.gain.value = .011; w2.connect(hp).connect(dg).connect(always);
    const lfo = c.createOscillator(); lfo.frequency.value = .37; const lg = c.createGain(); lg.gain.value = .014; lfo.connect(lg); lg.connect(wg.gain); lfo.start();
    // breeze and a whisper of distant city
    const wi = this.noiseSource(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; const wig = c.createGain(); wig.gain.value = .03; wi.connect(lp).connect(wig).connect(always);
    const l2 = c.createOscillator(); l2.frequency.value = .06; const l2g = c.createGain(); l2g.gain.value = .02; l2.connect(l2g); l2g.connect(wig.gain); l2.start();
    const ci = this.noiseSource(), cl = c.createBiquadFilter(); cl.type = 'lowpass'; cl.frequency.value = 150; const cg = c.createGain(); cg.gain.value = .022; ci.connect(cl).connect(cg).connect(always);
    // warm pad that glides between four chords
    this.padFilter = c.createBiquadFilter(); this.padFilter.type = 'lowpass'; this.padFilter.frequency.value = 1500; const pg = c.createGain(); pg.gain.value = .03; this.padFilter.connect(pg).connect(always);
    CHORDS[0].forEach((f, i) => { const o = c.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 5; o.connect(this.padFilter); o.start(); this.pad.push(o); });
    const trem = c.createOscillator(); trem.frequency.value = .09; const tg = c.createGain(); tg.gain.value = .009; trem.connect(tg); tg.connect(pg.gain); trem.start();
    // crickets for the night bus: three pulsing carriers
    [4180, 4350, 4520].forEach((f, i) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = c.createGain(); g.gain.value = .0045;
      const am = c.createOscillator(); am.type = 'square'; am.frequency.value = 26 + i * 2.6; const ag = c.createGain(); ag.gain.value = .0045; am.connect(ag); ag.connect(g.gain);
      const gate = c.createOscillator(); gate.frequency.value = .3 + i * .11; const gg = c.createGain(); gg.gain.value = .0028; gate.connect(gg); gg.connect(g.gain);
      o.connect(g).connect(this.night); o.start(); am.start(); gate.start();
    });
    this.timer = window.setInterval(() => this.tick(), 240);
  }

  private tick() {
    const c = this.ctx; if (!c || c.state !== 'running' || this.muted) return; const now = c.currentTime;
    if (now + .3 > this.nextChord) { this.chord = (this.chord + 1) % CHORDS.length; this.pad.forEach((o, i) => o.frequency.setTargetAtTime(CHORDS[this.chord][i], now, 3)); this.nextChord = now + 16; }
    if (now + .3 > this.nextSparkle) { this.sparkle(Math.max(now, this.nextSparkle)); this.nextSparkle = now + (this.theme === 'day' ? 1.6 + Math.random() * 3.2 : 3 + Math.random() * 5); }
    if (this.theme === 'day' && now + .3 > this.nextBird) { this.bird(Math.max(now, this.nextBird)); this.nextBird = now + 2.5 + Math.random() * 7; }
  }

  private sparkle(t: number) {
    const c = this.ctx!; const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] * (this.theme === 'night' ? .5 : 1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.016, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + 1.9);
    o.connect(g).connect(this.echo); o.start(t); o.stop(t + 2);
  }

  private bird(t: number) {
    const c = this.ctx!; const base = 2300 + Math.random() * 1700; const notes = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notes; i++) {
      const s = t + i * (.11 + Math.random() * .05); const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
      const f = base * (1 + (Math.random() - .3) * .28); o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f * (1.12 + Math.random() * .3), s + .07);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.011, s + .012); g.gain.exponentialRampToValueAtTime(.0001, s + .09);
      o.connect(g).connect(this.day); o.start(s); o.stop(s + .11);
    }
  }
}

export const soundscape = new Soundscape();
