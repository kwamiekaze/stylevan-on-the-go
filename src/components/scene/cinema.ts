import * as THREE from 'three';

/**
 * Camera timelines. Positions are world meters. `w` is how much the shot is an
 * exterior shot (1) or an interior one (0): on phones exterior shots pull back
 * further so the whole rig fits, interiors stay tight.
 * Edit times, positions or captions here to re-cut the film.
 */
export type Key = { t: number; p: [number, number, number]; l: [number, number, number]; fov: number; w: number };
export type Caption = { t: number; title: string; sub: string };

export const INTRO: Key[] = [
  { t: 0, p: [-17, 1.25, 13], l: [-1.4, 1.3, 0], fov: 36, w: 1 },
  { t: 4.5, p: [-7.5, 1.5, 18], l: [-.9, 1.35, 0], fov: 36, w: 1 },
  { t: 9, p: [3, 2.3, 19], l: [-.7, 1.35, 0], fov: 37, w: 1 },
  { t: 13.5, p: [8.6, 3.7, 14.6], l: [-.6, 1.3, 0], fov: 38, w: 1 },
];

export const TOUR: Key[] = [
  { t: 0, p: [9.5, 3.2, 14], l: [-.6, 1.4, 0], fov: 36, w: 1 },
  { t: 4.5, p: [6.6, 2.3, 8.6], l: [2.4, 1.4, 0], fov: 38, w: 1 },
  { t: 8.5, p: [4.4, 1.85, 5.2], l: [2.7, 1.3, 0], fov: 40, w: 1 },
  { t: 12.5, p: [3.1, 1.7, 3.7], l: [3.0, 1.15, -.3], fov: 42, w: 1 },
  { t: 16.5, p: [2.4, 1.65, 3.5], l: [1.9, 1.3, -.4], fov: 42, w: 1 },
  { t: 20.5, p: [1.6, 1.65, 3.4], l: [.6, 1.25, -.2], fov: 42, w: 1 },
  { t: 24.5, p: [.2, 1.8, 4.3], l: [-1.2, 1.4, 0], fov: 40, w: 1 },
  { t: 29, p: [-2.4, 1.85, 5.6], l: [-4.4, 1.5, 0], fov: 38, w: 1 },
  { t: 33, p: [-3.6, 1.7, 3.9], l: [-4.2, 1.5, -.5], fov: 42, w: 1 },
  { t: 37, p: [-4.8, 1.65, 3.7], l: [-5.1, 1.7, -.7], fov: 42, w: 1 },
  { t: 41, p: [-6.1, 1.7, 3.7], l: [-6.7, 1.3, -.2], fov: 42, w: 1 },
  { t: 45, p: [-7.4, 2.0, 5.0], l: [-6.0, 1.5, 0], fov: 38, w: 1 },
  { t: 50, p: [-3.5, 3.3, 11.5], l: [-.6, 1.4, 0], fov: 37, w: 1 },
  { t: 55, p: [8.6, 3.7, 14.6], l: [-.6, 1.3, 0], fov: 38, w: 1 },
];

export const CAPTIONS: Caption[] = [
  { t: 0, title: 'THE STYLE VAN', sub: 'Beauty on the way' },
  { t: 8, title: 'THE VAN', sub: 'A full beauty suite, parked at your door' },
  { t: 12.5, title: 'LASH, BROW & REFRESHMENTS', sub: 'Reclined, lit and unhurried' },
  { t: 16.5, title: 'THE BARBER STATION', sub: 'Gold framed mirror, precision styling' },
  { t: 20.5, title: 'SHAMPOO & MANICURE', sub: 'Everything for the full look' },
  { t: 29, title: 'THE TRAILER', sub: 'Bridal and event prep, 20 ft of room' },
  { t: 33, title: 'PRODUCT WALL & VANITY', sub: 'Hollywood lit mirrors for the whole party' },
  { t: 41, title: 'BRIDAL LOUNGE', sub: 'Gowns, champagne and a place to breathe' },
  { t: 50, title: 'BEAUTY ON THE WAY', sub: 'Book The Style Van for your moment' },
];

export const INTRO_LENGTH = INTRO[INTRO.length - 1].t;
export const TOUR_LENGTH = TOUR[TOUR.length - 1].t;

export type Sample = { p: THREE.Vector3; l: THREE.Vector3; fov: number; w: number };
export const makeSample = (): Sample => ({ p: new THREE.Vector3(), l: new THREE.Vector3(), fov: 38, w: 1 });

/** Velocity continuous (Hermite) interpolation through timed keyframes with eased start and end. */
export function sample(keys: Key[], t: number, out: Sample) {
  const n = keys.length;
  if (t <= keys[0].t) { const k = keys[0]; out.p.set(...k.p); out.l.set(...k.l); out.fov = k.fov; out.w = k.w; return out; }
  if (t >= keys[n - 1].t) { const k = keys[n - 1]; out.p.set(...k.p); out.l.set(...k.l); out.fov = k.fov; out.w = k.w; return out; }
  let i = 0; while (i < n - 2 && t >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1], dt = b.t - a.t, s = (t - a.t) / dt;
  const pr = keys[i - 1], nx = keys[i + 2];
  const s2 = s * s, s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  const H = (va: number, vb: number, vp: number | undefined, vn: number | undefined) => {
    const ma = pr === undefined || vp === undefined ? 0 : (vb - vp) / (b.t - pr.t);
    const mb = nx === undefined || vn === undefined ? 0 : (vn - va) / (nx.t - a.t);
    return h00 * va + h10 * dt * ma + h01 * vb + h11 * dt * mb;
  };
  for (let c = 0; c < 3; c++) {
    out.p.setComponent(c, H(a.p[c], b.p[c], pr?.p[c], nx?.p[c]));
    out.l.setComponent(c, H(a.l[c], b.l[c], pr?.l[c], nx?.l[c]));
  }
  out.fov = H(a.fov, b.fov, pr?.fov, nx?.fov);
  out.w = a.w + (b.w - a.w) * (s * s * (3 - 2 * s));
  return out;
}

export function captionAt(t: number) {
  let c = CAPTIONS[0];
  for (const k of CAPTIONS) if (t >= k.t) c = k;
  return c;
}
