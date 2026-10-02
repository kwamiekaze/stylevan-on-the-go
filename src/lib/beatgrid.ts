/**
 * Finds the musical grid of a track: its tempo, exactly where the beats fall, which beat starts each bar, and how intense every
 * bar is. The music cuts use this to cut on bar lines and to match the length of every camera move to its cut. It works on any
 * track (the one on the homepage today, and tracks uploaded later), because it only needs the decoded audio.
 */
export type PCM = { sampleRate: number; length: number; getChannelData(i: number): Float32Array };

export type BeatGrid = {
  /** Beats per minute. */
  bpm: number;
  /** Seconds per beat. */
  beat: number;
  /** Seconds from the start of the track to the first beat of the first full bar (the downbeat). */
  offset: number;
  /** Seconds per bar (four beats). */
  bar: number;
  /** Track length in seconds. */
  duration: number;
  /** Intensity of each bar from 0 (quiet) to 1 (the track's most driving moments), starting at `offset`. */
  energy: number[];
  /** Intensity of the song's section around each bar (a two bar average, 0 to 1): high where the track drives, low where it breathes. */
  intensity: number[];
  /** Which bars begin a two bar phrase: 0 means bars 0, 2, 4 and so on, 1 means bars 1, 3, 5. The stronger bar of each pair opens the phrase. */
  strongBar: 0 | 1;
  /** 0 to 1: how confident the analysis is that the track has a steady beat. Below about 0.25 the cuts fall back to reading the music live. */
  confidence: number;
};

const HOP_SECONDS = 0.0116;               // about 11.6 ms per analysis frame, fine enough to place a beat within a few milliseconds

/** One pole low pass, used to isolate the kick and bass. */
function lowpass(x: Float32Array, sr: number, cutoff: number, out: Float32Array) {
  const a = 1 - Math.exp(-2 * Math.PI * cutoff / sr); let y = 0;
  for (let i = 0; i < x.length; i++) { y += a * (x[i]! - y); out[i] = y; }
}

export function analyzeTrack(pcm: PCM): BeatGrid | null {
  const sr = pcm.sampleRate, n = pcm.length; if (n < sr * 8) return null;
  // mono mix
  const ch = Math.min(2, (pcm as unknown as { numberOfChannels?: number }).numberOfChannels ?? 1);
  const mono = new Float32Array(n); for (let c = 0; c < ch; c++) { const d = pcm.getChannelData(c); for (let i = 0; i < n; i++) mono[i]! += d[i]! / ch; }
  const hop = Math.max(64, Math.round(sr * HOP_SECONDS)), fps = sr / hop, frames = Math.floor((n - hop) / hop);
  const low = new Float32Array(n); lowpass(mono, sr, 180, low);
  // energy per frame: whole signal and the bass; onsets are positive jumps in the log energy of each
  const eAll = new Float32Array(frames), eLow = new Float32Array(frames);
  for (let f = 0; f < frames; f++) { let s = 0, l = 0; const a = f * hop; for (let i = a; i < a + hop; i++) { s += mono[i]! * mono[i]!; l += low[i]! * low[i]!; } eAll[f] = Math.sqrt(s / hop); eLow[f] = Math.sqrt(l / hop); }
  const onset = new Float32Array(frames);
  const logE = (v: number) => Math.log(1 + 40 * v);
  for (let f = 1; f < frames; f++) { const d1 = logE(eAll[f]!) - logE(eAll[f - 1]!), d2 = logE(eLow[f]!) - logE(eLow[f - 1]!); onset[f] = Math.max(0, d1) + 1.4 * Math.max(0, d2); }
  // remove the slow trend so loud passages do not swamp quiet ones
  const w = Math.round(fps * 1.2); let acc = 0; const sm = new Float32Array(frames); for (let f = 0; f < frames; f++) { acc += onset[f]!; if (f >= w) acc -= onset[f - w]!; sm[f] = acc / Math.min(f + 1, w); }
  for (let f = 0; f < frames; f++) onset[f] = Math.max(0, onset[f]! - sm[f]!);

  // Tempo. Autocorrelation proposes a few candidate pulses; each one, and its close musical relatives (half, double, 2/3, 3/2, 3/4, 4/3),
  // is then tested by how strongly the onsets land on its beats ON AVERAGE. Averaging matters: a faster grid has more beats, so
  // judging by the total would always favour the busiest pulse (a dotted rhythm at 128 can fool it on a 96 bpm song).
  const minLag = Math.floor(fps * 60 / 200), maxLag = Math.ceil(fps * 60 / 55); const ac = new Float32Array(maxLag * 3 + 4);
  for (let lag = minLag; lag < ac.length; lag++) { let s = 0; for (let f = lag; f < frames; f++) s += onset[f]! * onset[f - lag]!; ac[lag] = s / (frames - lag); }
  const prior = (bpm: number) => Math.exp(-Math.pow(Math.log2(bpm / 100), 2) / (2 * 0.6 * 0.6));
  const peaks: { lag: number; s: number }[] = [];
  for (let lag = minLag + 1; lag < maxLag; lag++) if (ac[lag]! > ac[lag - 1]! && ac[lag]! >= ac[lag + 1]!) peaks.push({ lag, s: (ac[lag]! + .5 * (ac[lag * 2] ?? 0)) * prior(60 * fps / lag) });
  peaks.sort((x, y) => y.s - x.s);
  const cands = new Set<number>(); const RATIOS = [1, .5, 2, 2 / 3, 1.5, .75, 4 / 3];
  for (const pk of peaks.slice(0, 3)) for (const r of RATIOS) { const per = (pk.lag / fps) * r, bpm = 60 / per; if (bpm >= 55 && bpm <= 200) cands.add(Math.round(per * 10000) / 10000); }
  const mean = (p: number, o: number) => { let s = 0, c = 0; for (let t = o; t < frames / fps - .05; t += p) { const f = Math.round(t * fps); if (f >= 1 && f < frames - 1) { s += Math.max(onset[f]!, .7 * onset[f - 1]!, .7 * onset[f + 1]!); c++; } } return c ? s / c : 0; };
  let bp = 0.6, bo = 0, bscore = -1, bfit = 0;
  for (const p0 of cands) {
    let cs = -1, cp = p0, co = 0;
    for (let k = -8; k <= 8; k++) { const p = p0 * (1 + k * .002); for (let o = 0; o < p; o += 1 / fps / 2) { const m = mean(p, o); if (m > cs) { cs = m; cp = p; co = o; } } }
    const weighted = cs * (.35 + .65 * prior(60 / cp));      // a gentle lean toward everyday tempos, without overriding a clearly stronger grid
    if (weighted > bscore) { bscore = weighted; bfit = cs; bp = cp; bo = co; }
  }
  // fine search around the winner at millisecond steps, by average strength
  for (let k = -12; k <= 12; k++) { const p = bp * (1 + k * .00005); for (let d = -.012; d <= .012; d += .001) { let o = (bo + d) % p; if (o < 0) o += p; const m = mean(p, o); if (m > bfit) { bfit = m; bp = p; bo = o; } } }
  const beat = bp; let first = bo;
  // Millisecond refinement: the coarse grid sits within a frame or two of the beats. Line it up with the sharpest attacks (steepest rise of a
  // 4 ms envelope) found near each beat, and shift the whole grid by the typical gap.
  {
    const k = Math.max(1, Math.round(sr * .004)), step = Math.max(1, Math.round(sr * .002)); const cum = new Float64Array(n + 1); for (let i = 0; i < n; i++) cum[i + 1] = cum[i]! + Math.abs(mono[i]!);
    const env = (i: number) => (cum[Math.min(n, i + k)]! - cum[i]!) / k; const gaps: number[] = [];
    for (let t = first; t < n / sr - .1; t += beat) {
      const c = Math.round(t * sr); let bd = 0, bt = -1; for (let i = c - Math.round(sr * .05); i <= c + Math.round(sr * .05); i += step) { if (i < step || i + k >= n) continue; const d = env(i) - env(i - step); if (d > bd) { bd = d; bt = i; } }
      if (bt >= 0 && bd > 0) gaps.push(bt / sr - t);
    }
    if (gaps.length > 8) { gaps.sort((a, b) => a - b); const med = gaps[Math.floor(gaps.length / 2)]!; first += Math.max(-.04, Math.min(.04, med)); }
  }
  // total fit versus a random grid gives the confidence
  let rand = 0; for (let t = 1; t < 8; t++) rand += mean(beat, (bo + (beat * t) / 8) % beat) / 7;
  const confidence = Math.max(0, Math.min(1, bfit > 0 ? (bfit - rand) / (bfit + 1e-9) * 1.5 : 0));

  // which of the four beats starts the bar: the one whose kicks are the strongest
  const kick = new Float32Array(4); const beats = Math.floor((frames / fps - first) / beat);
  for (let b = 0; b < beats; b++) { const f = Math.round((first + b * beat) * fps); if (f >= 0 && f < frames) kick[b % 4]! += eLow[f]! + .3 * onset[f]!; }
  let down = 0; for (let k = 1; k < 4; k++) if (kick[k]! > kick[down]! * 1.04) down = k;
  first += down * beat; const bar = beat * 4;

  // energy of every bar, relative to the track's own loud moments
  const bars = Math.max(1, Math.floor((frames / fps - first) / bar)); const raw: number[] = [];
  for (let k = 0; k < bars; k++) { const a = Math.round((first + k * bar) * fps), b = Math.min(frames, Math.round((first + (k + 1) * bar) * fps)); let s = 0, o = 0; for (let f = a; f < b; f++) { s += eAll[f]!; o += onset[f]!; } const m = Math.max(1, b - a); raw.push(.65 * (s / m) + .35 * (o / m) * .5); }
  const sorted = [...raw].sort((x, y) => x - y), lo = sorted[Math.floor(sorted.length * .05)]!, hi = sorted[Math.floor(sorted.length * .95)]!;
  const energy = raw.map(v => Math.max(0, Math.min(1, (v - lo) / Math.max(1e-6, hi - lo))));
  // section intensity: a two bar average removes the strong, weak, strong, weak pulse so what is left is how hard the song is driving
  const two = energy.map((v, i) => (v + (energy[i + 1] ?? v)) / 2); const ts = [...two].sort((x, y) => x - y), tlo = ts[Math.floor(ts.length * .05)]!, thi = ts[Math.floor(ts.length * .95)]!;
  const intensity = two.map(v => Math.max(0, Math.min(1, (v - tlo) / Math.max(1e-6, thi - tlo))));
  let even = 0, odd = 0; energy.forEach((v, i) => { if (i % 2) odd += v; else even += v; });
  return { bpm: 60 / beat, beat, offset: first, bar, duration: n / sr, energy, intensity, strongBar: odd > even ? 1 : 0, confidence };
}
