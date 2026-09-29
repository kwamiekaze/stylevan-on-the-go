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
  { t: 0, p: [12, 3.6, 16], l: [-.5, 1.4, 0], fov: 36, w: 1 },
  { t: 5, p: [7.2, 2.4, 9.5], l: [2.2, 1.5, 0], fov: 38, w: 1 },
  { t: 9, p: [3.7, 1.9, 4.8], l: [2.5, 1.5, 0], fov: 44, w: 1 },
  { t: 12, p: [2.75, 1.6, 2.6], l: [2.7, 1.4, 0], fov: 54, w: 0 },
  { t: 15.5, p: [2.2, 1.55, .15], l: [3.75, 1.1, .72], fov: 60, w: 0 },
  { t: 19.5, p: [2.55, 1.5, .75], l: [3.3, .95, -.5], fov: 60, w: 0 },
  { t: 23.5, p: [2.55, 1.55, .8], l: [1.35, 1.8, -1.0], fov: 58, w: 0 },
  { t: 27.5, p: [2.05, 1.55, .85], l: [1.3, 1.1, -.25], fov: 58, w: 0 },
  { t: 31.5, p: [1.35, 1.5, .95], l: [.2, 1.15, -.7], fov: 60, w: 0 },
  { t: 35.5, p: [1.75, 1.6, .2], l: [.7, .95, .7], fov: 60, w: 0 },
  { t: 39.5, p: [2.6, 1.6, 1.4], l: [2.6, 1.5, 3.2], fov: 54, w: 0 },
  { t: 44, p: [-.6, 1.9, 5.8], l: [-5, 1.5, 0], fov: 44, w: 1 },
  { t: 48, p: [-4.8, 1.8, 4.6], l: [-5.05, 1.5, 0], fov: 46, w: 1 },
  { t: 51, p: [-5.0, 1.7, 2.9], l: [-5.05, 1.5, 0], fov: 56, w: 0 },
  { t: 54, p: [-5.0, 1.55, 1.4], l: [-4.8, 1.7, -1.1], fov: 62, w: 0 },
  { t: 58, p: [-4.3, 1.5, .8], l: [-5.7, 1.9, -1.0], fov: 62, w: 0 },
  { t: 62, p: [-5.4, 1.5, .9], l: [-6.8, 1.2, -.4], fov: 62, w: 0 },
  { t: 66, p: [-5.3, 1.3, 1.0], l: [-6.9, .9, .3], fov: 62, w: 0 },
  { t: 70, p: [-6.3, 1.5, .5], l: [-4.2, 1.6, -.4], fov: 62, w: 0 },
  { t: 74, p: [-4.6, 1.5, .8], l: [-2.5, 1.35, -.3], fov: 60, w: 0 },
  { t: 78, p: [-4.9, 1.8, 2.8], l: [-5.05, 1.5, 0], fov: 54, w: .5 },
  { t: 84, p: [-1, 4.8, 17], l: [-.6, 1.4, 0], fov: 38, w: 1 },
  { t: 88, p: [8.6, 3.7, 14.6], l: [-.6, 1.3, 0], fov: 38, w: 1 },
];

export const CAPTIONS: Caption[] = [
  { t: 0, title: 'THE STYLE VAN', sub: 'Beauty on the way' },
  { t: 12, title: 'THE ENTRANCE', sub: 'A full beauty suite, parked at your door' },
  { t: 15, title: 'REFRESHMENT NOOK', sub: 'Chilled drinks for every client' },
  { t: 19, title: 'LASH & BROW BED', sub: 'Reclined, lit and unhurried' },
  { t: 23, title: 'THE BARBER STATION', sub: 'Gold framed mirror, precision styling' },
  { t: 31, title: 'SHAMPOO BAR', sub: 'A proper wash, right inside the van' },
  { t: 35, title: 'MANICURE STATION', sub: 'Polish, art and finishing touches' },
  { t: 44, title: 'THE TRAILER', sub: 'Bridal and event prep, 20 ft of room' },
  { t: 54, title: 'THE VANITY', sub: 'Hollywood lit mirrors for the whole party' },
  { t: 62, title: 'BRIDAL LOUNGE', sub: 'Gowns, champagne and a place to breathe' },
  { t: 74, title: 'PRODUCT WALL', sub: 'Everything within arm’s reach' },
  { t: 84, title: 'BEAUTY ON THE WAY', sub: 'Book The Style Van for your moment' },
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
