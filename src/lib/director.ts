/**
 * Music cuts: a virtual film editor for the 3D scene.
 *
 * There are 58 camera setups of the van and trailer (close ups, details, hero shots, wides, bird's eye, overhead, low angle,
 * tracking, cranes, orbits, whip pans, dutch angles, dolly zooms and crash zooms). The editor listens to the music
 * through the shared audio analyser and cuts on the beat: calm passages get wide, slow, graceful moves with longer takes, and
 * driving passages get quick close ups, low angles and whips. It never repeats a shot or a type of shot back to back, and it
 * keeps the lens clear of the vehicles. Everything is just a camera pose per frame, so it costs almost nothing on any device.
 */
export type Kind = 'close' | 'detail' | 'medium' | 'wide' | 'bird' | 'overhead' | 'low' | 'orbit' | 'track' | 'crane' | 'whip' | 'dutch' | 'vertigo' | 'zoom' | 'reveal';
export type V3 = readonly [number, number, number];
export type Bands = { bass: number; mid: number; high: number; level: number };
export type Shot = { id: number; name: string; kind: Kind; f0: V3; f1: V3; r: [number, number]; az: [number, number]; el: [number, number]; fov: [number, number]; roll: [number, number]; dur: number; ease: 'inout' | 'out' | 'in' | 'linear'; vertigo: boolean; shake: number };
export type Pose = { pos: [number, number, number]; target: [number, number, number]; fov: number; roll: number };

export const KIND_LABEL: Record<Kind, string> = { close: 'CLOSE UP', detail: 'DETAIL', medium: 'MEDIUM SHOT', wide: 'WIDE SHOT', bird: 'BIRD’S EYE', overhead: 'OVERHEAD', low: 'LOW ANGLE', orbit: 'ORBIT', track: 'TRACKING SHOT', crane: 'CRANE', whip: 'WHIP PAN', dutch: 'DUTCH ANGLE', vertigo: 'DOLLY ZOOM', zoom: 'CRASH ZOOM', reveal: 'REVEAL' };

/** World positions of things worth looking at. The van faces +x, the trailer is hitched behind it, the lane in front of both is +z. */
const P = {
  all: [-1.1, 1.4, 0], hero: [-1.5, 1.35, 0], van: [2.9, 1.35, 0], trailer: [-5.05, 1.5, 0],
  grille: [5.85, .95, 0], headR: [5.85, 1.04, .82], headL: [5.85, 1.04, -.82], glass: [5.2, 1.95, 0], cabRoof: [4.7, 2.85, 0], mirrorR: [5.15, 2.07, 1.4],
  vanDoor: [1.33, 1.78, 1.15], vanAwn: [1.33, 2.45, 1.5], vanRoof: [1.35, 3.0, 0], wheelF: [5.0, .4, 1.05], wheelR: [1.1, .4, 1.05],
  hitch: [-1.2, .65, 0], trWheel: [-5.9, .4, 1.3], trAwn: [-5.05, 1.9, 1.4], trRear: [-8.05, 1.6, 0], trRoof: [-4.9, 3.25, 0],
  vanSide: [2.9, 1.4, 1.1], trSide: [-5.05, 1.4, 1.2], plaza: [-1.5, .45, 0], toFountain: [-1.5, 1.3, 2],
} satisfies Record<string, V3>;
type PN = keyof typeof P;
type Focus = PN | V3 | readonly [PN | V3, PN | V3];
const pt = (f: PN | V3): V3 => (typeof f === 'string' ? P[f] : f);
const isPair = (f: Focus): f is readonly [PN | V3, PN | V3] => Array.isArray(f) && f.length === 2 && (typeof f[0] === 'string' || Array.isArray(f[0]));

type Opt = { roll?: [number, number]; ease?: Shot['ease']; vertigo?: boolean; shake?: number };
const shots: Shot[] = [];
function S(name: string, kind: Kind, f: Focus, r: [number, number], az: [number, number], el: [number, number], fov: [number, number], dur: number, o: Opt = {}) {
  const a = isPair(f) ? pt(f[0]) : pt(f as PN | V3), b = isPair(f) ? pt(f[1]) : a;
  shots.push({ id: shots.length, name, kind, f0: a, f1: b, r, az, el, fov, roll: o.roll ?? [0, 0], dur, ease: o.ease ?? 'inout', vertigo: !!o.vertigo, shake: o.shake ?? (kind === 'close' || kind === 'detail' ? .018 : .008) });
}

// close ups and details
S('Grille push in', 'close', 'grille', [3.4, 2.0], [32, 14], [7, 4], [34, 28], 3.6);
S('Headlight glow', 'close', 'headR', [2.4, 1.7], [62, 44], [4, 3], [30, 26], 3.2);
S('The other headlight', 'close', 'headL', [2.6, 1.9], [125, 140], [3, 2], [30, 26], 3.2);
S('Windshield stare', 'close', 'glass', [4.0, 2.8], [18, 8], [12, 9], [30, 26], 3.4, { roll: [3, 0] });
S('Mirror detail', 'detail', 'mirrorR', [2.2, 1.7], [78, 58], [12, 16], [30, 26], 3.0);
S('Front rim', 'close', 'wheelF', [2.6, 1.9], [68, 52], [9, 6], [30, 27], 3.0);
S('Rear dual wheels', 'close', 'wheelR', [3.0, 2.2], [50, 40], [8, 5], [30, 27], 3.2);
S('Service icons on the door', 'detail', 'vanDoor', [3.4, 2.4], [8, -4], [7, 6], [32, 28], 3.6);
S('Van awning edge', 'detail', 'vanAwn', [3.2, 2.5], [42, 22], [22, 18], [32, 28], 3.2);
S('Trailer awning stripes', 'detail', 'trAwn', [3.8, 2.8], [12, -4], [13, 10], [34, 30], 3.6);
S('Tandem trailer wheels', 'close', 'trWheel', [3.4, 2.5], [72, 55], [7, 5], [32, 28], 3.2);
S('Hitch and tongue', 'detail', 'hitch', [2.8, 2.0], [14, 32], [26, 22], [32, 28], 3.2);
S('Trailer rear doors', 'close', 'trRear', [5.5, 3.6], [-92, -108], [8, 7], [34, 30], 3.6);
S('Cab roof lights', 'detail', 'cabRoof', [3.4, 2.6], [58, 34], [32, 28], [34, 30], 3.0);
S('Roof air conditioner', 'detail', 'vanRoof', [3.8, 3.0], [30, 8], [38, 34], [34, 30], 3.0);
S('Trailer roof', 'detail', 'trRoof', [4.2, 3.4], [-30, -8], [36, 32], [34, 30], 3.0);
// hero and medium
S('Front three quarter', 'medium', 'van', [9.5, 7.8], [42, 32], [10, 8], [36, 34], 4.2);
S('Heroic low front', 'low', 'van', [8.2, 7.0], [38, 28], [-6, -4], [34, 32], 4.0);
S('Van side profile', 'medium', 'vanSide', [8.5, 7.5], [4, -6], [4, 5], [36, 34], 4.0);
S('Trailer side profile', 'medium', 'trSide', [9.5, 8.5], [-4, 6], [4, 5], [38, 36], 4.0);
S('Truck by', 'track', [[-7.5, 1.2, 1.2], [5.5, 1.2, 1.2]], [8.5, 8.5], [0, 0], [5, 5], [36, 36], 5.0, { ease: 'linear' });
S('Rear three quarter', 'medium', 'trailer', [11, 9], [-138, -124], [12, 10], [38, 36], 4.2);
S('Reverse reveal', 'reveal', [[5.8, 1.3, 0], [-3, 1.3, 0]], [4.5, 10], [88, 76], [7, 6], [34, 38], 4.6);
S('Golden hour long lens', 'medium', 'van', [16, 14], [30, 22], [5, 6], [18, 16], 4.2);
S('Telephoto trailer', 'medium', 'trailer', [17, 15], [-26, -18], [5, 6], [18, 16], 4.2);
// wides
S('Establishing wide', 'wide', 'all', [24, 20], [26, 22], [14, 12], [40, 40], 4.8);
S('Plaza and mansion', 'wide', 'all', [32, 30], [2, -4], [8, 9], [40, 40], 4.8);
S('Mansion behind the van', 'wide', [-1.5, 3.5, -3], [16, 13], [12, 6], [4, 6], [40, 40], 4.6);
S('The far side', 'wide', 'toFountain', [8.5, 8.5], [168, 185], [9, 9], [40, 40], 4.4);
S('Backlit hero', 'wide', 'all', [22, 20], [4, -6], [3, 4], [40, 40], 4.8);
S('Sweeping orbit', 'orbit', 'all', [22, 22], [70, -50], [11, 11], [40, 40], 6.0);
// bird's eye and overhead
S('Bird’s eye drift', 'bird', 'all', [19, 21], [20, 50], [56, 60], [40, 40], 5.0);
S('High corner view', 'bird', 'all', [24, 22], [120, 95], [64, 60], [42, 42], 5.0);
S('Bird’s eye on the grille', 'bird', 'grille', [14, 11], [82, 98], [50, 44], [36, 32], 4.0);
S('Overhead plan', 'overhead', 'all', [15, 15], [0, 50], [86, 88], [44, 44], 5.0);
S('Overhead the van', 'overhead', 'van', [10, 10], [90, 140], [84, 87], [36, 36], 4.6);
S('Overhead the awning', 'overhead', 'trailer', [11, 9], [-60, -30], [78, 84], [36, 36], 4.6);
S('God shot spin', 'overhead', 'hero', [20, 20], [0, 200], [82, 82], [44, 44], 6.0, { ease: 'linear' });
S('Drone crane up', 'crane', 'hero', [7, 24], [30, 60], [6, 62], [36, 42], 5.0, { ease: 'out' });
S('Drone crane down', 'crane', 'hero', [26, 9], [70, 35], [66, 12], [42, 36], 5.0);
// low angles
S('Worm’s eye hero', 'low', 'van', [7.5, 6.5], [26, 16], [-8, -6], [30, 28], 4.0);
S('Looming grille', 'low', 'grille', [3.8, 2.8], [22, 10], [-10, -8], [30, 26], 3.4);
S('Low trailer', 'low', 'trailer', [10, 8.5], [-34, -22], [-9, -7], [34, 32], 4.0);
S('Rim level skim', 'low', 'wheelF', [5.5, 3.5], [72, 50], [-1, -1], [30, 28], 3.6);
S('Reflection glide', 'low', 'plaza', [13, 11], [22, 10], [1, 1], [30, 30], 4.4);
S('Hitch from the ground', 'low', 'hitch', [4.6, 3.4], [30, 12], [-2, -1], [30, 28], 3.2);
S('Wheel height truck by', 'track', [[5.5, .65, 1.1], [0, .65, 1.1]], [3.4, 3.4], [0, 0], [3, 3], [38, 38], 3.6, { ease: 'linear' });
S('Roof level fly by', 'track', [[6, 2.9, 1.3], [-8, 2.9, 1.3]], [6.5, 6.5], [0, 0], [14, 14], [40, 40], 5.4, { ease: 'linear' });
// hollywood
S('Dutch tilt hero', 'dutch', 'van', [7.2, 6.4], [46, 38], [9, 8], [36, 34], 3.6, { roll: [10, 16] });
S('Dutch low trailer', 'dutch', 'trailer', [9.5, 8.5], [-52, -40], [-5, -4], [34, 32], 3.6, { roll: [-14, -8] });
S('Dolly zoom on the grille', 'vertigo', 'grille', [7.0, 3.4], [40, 24], [8, 5], [26, 26], 3.6, { vertigo: true });
S('Dolly zoom on the awning', 'vertigo', 'trAwn', [9.0, 4.4], [14, 2], [12, 10], [28, 28], 3.8, { vertigo: true });
S('Whip pan arrival', 'whip', 'van', [8.5, 8.0], [125, 32], [8, 7], [36, 36], 1.8, { ease: 'out', shake: .02 });
S('Whip tilt up', 'whip', 'trailer', [9, 9], [-30, -30], [-6, 40], [36, 36], 1.8, { ease: 'out' });
S('Crash zoom on the grille', 'zoom', 'grille', [5.0, 5.0], [28, 24], [6, 6], [58, 22], 1.2, { ease: 'in', shake: .02 });
S('Slow orbit around the van', 'orbit', 'van', [6.6, 6.6], [0, 160], [8, 10], [34, 34], 7.0);
S('Slow orbit around the trailer', 'orbit', 'trailer', [9, 9], [-170, -20], [10, 12], [36, 36], 7.0);
S('Grand orbit', 'orbit', 'hero', [21, 21], [90, -90], [18, 16], [40, 40], 7.0);

export const SHOTS: readonly Shot[] = shots;
export const SHOT_COUNT = shots.length;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (k: Shot['ease'], t: number) => k === 'linear' ? t : k === 'out' ? 1 - (1 - t) ** 3 : k === 'in' ? t ** 3 : -(Math.cos(Math.PI * t) - 1) / 2;

/* Keeping the lens out of the vehicles and out of the void. Boxes are the van and trailer with a little air around them. */
const BOXES = [{ min: [-.35, 0, -1.3], max: [6.2, 3.3, 1.3] }, { min: [-8.25, 0, -1.45], max: [-1.9, 3.45, 1.45] }] as const;
const MIN_GAP = 1.3;
function keepClear(p: [number, number, number]) {
  p[0] = clamp(p[0], -24, 24); p[1] = clamp(p[1], .3, 40); p[2] = clamp(p[2], -8.5, 30);
  for (const b of BOXES) {
    const nx = clamp(p[0], b.min[0], b.max[0]), ny = clamp(p[1], b.min[1], b.max[1]), nz = clamp(p[2], b.min[2], b.max[2]);
    let dx = p[0] - nx, dy = p[1] - ny, dz = p[2] - nz; const d = Math.hypot(dx, dy, dz);
    if (d >= MIN_GAP) continue;
    if (d < 1e-4) {                                         // inside: leave through the nearest face
      const gaps = [p[0] - b.min[0], b.max[0] - p[0], p[1] - b.min[1], b.max[1] - p[1], p[2] - b.min[2], b.max[2] - p[2]]; const i = gaps.indexOf(Math.min(...gaps));
      [dx, dy, dz] = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]][i]!;
      p[0] = nx + dx * MIN_GAP; p[1] = ny + dy * MIN_GAP; p[2] = nz + dz * MIN_GAP;
      if (i === 0) p[0] = b.min[0] - MIN_GAP; if (i === 1) p[0] = b.max[0] + MIN_GAP; if (i === 2) p[1] = b.min[1] - MIN_GAP; if (i === 3) p[1] = b.max[1] + MIN_GAP; if (i === 4) p[2] = b.min[2] - MIN_GAP; if (i === 5) p[2] = b.max[2] + MIN_GAP;
    } else { p[0] = nx + dx / d * MIN_GAP; p[1] = ny + dy / d * MIN_GAP; p[2] = nz + dz / d * MIN_GAP; }
  }
  p[1] = Math.max(p[1], .3);
}

export function poseAt(s: Shot, progress: number, time: number, out: Pose, calm = false): Pose {
  const e = ease(s.ease, clamp(progress, 0, 1));
  const fx = lerp(s.f0[0], s.f1[0], e), fy = lerp(s.f0[1], s.f1[1], e), fz = lerp(s.f0[2], s.f1[2], e);
  const r = lerp(s.r[0], s.r[1], e), az = lerp(s.az[0], s.az[1], e) * Math.PI / 180, el = lerp(s.el[0], s.el[1], e) * Math.PI / 180;
  const k = calm ? 0 : s.shake;
  const pos: [number, number, number] = [fx + r * Math.cos(el) * Math.sin(az) + k * (Math.sin(time * 7.3) + Math.sin(time * 12.1 + 1.3)) * .5, fy + r * Math.sin(el) + k * (Math.sin(time * 6.1 + .7) + Math.sin(time * 10.7)) * .5, fz + r * Math.cos(el) * Math.cos(az) + k * (Math.sin(time * 8.3 + 2.1) + Math.sin(time * 11.3 + .4)) * .5];
  keepClear(pos);
  let fov = lerp(s.fov[0], s.fov[1], e);
  if (s.vertigo) fov = 2 * Math.atan(Math.tan(s.fov[0] * Math.PI / 360) * s.r[0] / r) * 180 / Math.PI;     // subject stays the same size while the world stretches
  out.pos = pos; out.target = [fx, fy, fz]; out.fov = fov; out.roll = lerp(s.roll[0], s.roll[1], e) + (calm ? 0 : k * 40 * Math.sin(time * 5.3));
  return out;
}

/* Which kinds of shot suit calm music [0] and driving music [1]. */
const WEIGHT: Record<Kind, [number, number]> = { wide: [1, .15], orbit: [.9, .2], bird: [.9, .25], overhead: [.8, .3], crane: [.8, .2], reveal: [.7, .15], medium: [.7, .5], track: [.5, .7], close: [.25, 1], detail: [.3, .9], low: [.4, 1], whip: [.05, .9], dutch: [.2, .7], zoom: [.02, .6], vertigo: [.3, .5] };

export class Director {
  idx = -1; since = 0; cuts = 0; clock = 0;
  private avgBass = .2; private beats: number[] = []; energy = .3; private lastBeat = -9; private metro = 0; private history: number[] = []; private lastKind: Kind | null = null; private seed = (Date.now() & 0xfffff) + 7;
  constructor(private calm = false) {}
  private rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  get shot(): Shot { return SHOTS[Math.max(0, this.idx)]!; }
  get progress() { return clamp(this.since / this.shot.dur, 0, 1); }

  /** Advance the edit by dt seconds using the current music bands (null when no music is playing). Returns true when a cut just happened. */
  update(dt: number, bands: Bands | null): boolean {
    this.clock += dt; this.since += dt;
    let beat = false, strong = false;
    if (bands && bands.level > .02) {
      const b = bands.bass;
      const rise = b - this.avgBass;                          // how far the low end jumps above its recent average
      if (rise > .045 && b > .1 && this.clock - this.lastBeat > .26) { beat = true; strong = rise > .09; this.lastBeat = this.clock; this.beats.push(this.clock); }
      this.avgBass += (b - this.avgBass) * clamp(dt * 1.3, 0, 1);
      while (this.beats.length && this.clock - this.beats[0]! > 4) this.beats.shift();
      // how driving the music feels: how often the beat hits, plus how loud it is, so steady calm music stays calm
      const dens = clamp((this.beats.length / 4 - .6) / 1.8, 0, 1), loud = clamp((bands.level - .1) / .3, 0, 1);
      this.energy += (.65 * dens + .35 * loud - this.energy) * clamp(dt * .8, 0, 1);
    } else {                                                  // no music to read: keep time like a drummer at about 110 bpm
      this.metro += dt; this.energy += (.5 - this.energy) * clamp(dt, 0, 1);
      if (this.metro > .545) { this.metro -= .545; beat = true; }
    }
    const e = this.energy, minDur = (this.calm ? 1.4 : 0) + lerp(2.6, 1.2, e), maxDur = lerp(5.8, 3.2, e);
    const due = this.idx < 0 || (this.since >= minDur && (beat || this.since >= maxDur)) || (strong && this.since >= 1.4 && !this.calm);
    if (!due) return false;
    this.cut(); return true;
  }

  private cut() {
    const e = this.energy; let best = -1, bestScore = -1;
    for (let i = 0; i < SHOTS.length; i++) {
      const s = SHOTS[i]!; let w = lerp(WEIGHT[s.kind][0], WEIGHT[s.kind][1], e);
      if (this.idx < 0 && s.name !== 'Establishing wide') w = 0;
      if (this.history.includes(i)) w *= .02; else if (this.history.length > 20 && this.history.indexOf(i) > -1) w *= .1;
      if (s.kind === this.lastKind) w *= .25;
      const score = w * (.5 + this.rnd());
      if (score > bestScore) { bestScore = score; best = i; }
    }
    this.idx = best; this.since = 0; this.cuts++; this.lastKind = SHOTS[best]!.kind;
    this.history.push(best); if (this.history.length > 40) this.history.shift();
  }

  pose(time: number, out: Pose) { return poseAt(this.shot, this.progress, time, out, this.calm); }
}
