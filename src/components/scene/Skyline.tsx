import { useContext, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { NightCtx, rng } from './theme';

/*
 * A ring of glass towers around the estate: curtain wall glass with mullions and floor bands, stepped tiers,
 * pyramid crowns and spires. Geometry is baked into a few merged meshes (one per glass palette), so the whole
 * skyline costs about eight draw calls and the mirrored copy under the plaza costs the same again.
 * Units: metres. Tower bodies sit 150 to 180 m from the centre, inside the sky sphere (radius 260).
 */

type Palette = { top: string; bottom: string; mullion: string; lit: string; name: string };
const WEIGHTS = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 1, 1, 2];  // mostly blue and steel glass, a few teal, bronze and stone towers
const PALETTES: Palette[] = [
  { name: 'blue', top: '#a9d2f7', bottom: '#2d68ad', mullion: '#16304f', lit: '#ffd9a0' },
  { name: 'teal', top: '#a5dbe0', bottom: '#2f8294', mullion: '#143a43', lit: '#ffe2b0' },
  { name: 'steel', top: '#d3deea', bottom: '#6d86a2', mullion: '#2b3a4d', lit: '#ffdcae' },
  { name: 'bronze', top: '#f0d3a0', bottom: '#94703d', mullion: '#3d2b17', lit: '#ffe0a8' },
  { name: 'stone', top: '#ece0cc', bottom: '#b9a78d', mullion: '#6a5a45', lit: '#ffd7a0' },
];
const COLS = 8, ROWS = 16, PANE_W = .85, FLOOR_H = 3.6;   // one texture tile is 8 panes by 16 floors

function glassCanvas(p: Palette, emissive: boolean, seed: number) {
  const W = 256, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!, r = rng(seed);
  const pw = W / COLS, ph = H / ROWS;
  g.fillStyle = emissive ? '#000' : p.mullion; g.fillRect(0, 0, W, H);
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    const x = col * pw, y = row * ph;
    if (emissive) {
      if (r() > .42) { g.fillStyle = p.lit; g.globalAlpha = .55 + r() * .45; g.fillRect(x + 2, y + 4, pw - 4, ph - 9); g.globalAlpha = 1; }
      continue;
    }
    const grad = g.createLinearGradient(x, y, x, y + ph);
    const k = (row / ROWS) * .55 + r() * .22;               // slightly different reflection per floor
    const top = new THREE.Color(p.top).lerp(new THREE.Color(p.bottom), k), bot = new THREE.Color(p.top).lerp(new THREE.Color(p.bottom), Math.min(1, k + .3));
    grad.addColorStop(0, '#' + top.getHexString()); grad.addColorStop(1, '#' + bot.getHexString());
    g.fillStyle = grad; g.fillRect(x + 1.5, y + 3, pw - 3, ph - 7);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x + 2, y + 3, 2, ph - 8);     // bright edge catch
    if (r() > .93) { g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(x + 1.5, y + 3, pw - 3, ph - 7); } // sun glint on a few panes
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  if (!emissive) t.colorSpace = THREE.SRGBColorSpace; else t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A box whose side faces carry the curtain wall texture at true scale; y0 is the base height. */
function body(w: number, h: number, d: number, x: number, y0: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const widths = [d, d, 1, 1, w, w];                                    // px nx py ny pz nz
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i; const fw = widths[f];
    uv.setXY(k, uv.getX(k) * (fw / (COLS * PANE_W)), uv.getY(k) * (h / (ROWS * FLOOR_H)) + (y0 % (ROWS * FLOOR_H)) / (ROWS * FLOOR_H));
  }
  g.translate(x, y0 + h / 2, z);
  return g;
}

const SUN = new THREE.Vector3(-.3, .34, -.88).normalize();
function haze(g: THREE.BufferGeometry) {            // sky reflection gradient up the tower, sun-warmed faces, haze at the base
  const p = g.attributes.position, nrm = g.attributes.normal; const col = new Float32Array(p.count * 3); const c = new THREE.Color(), n = new THREE.Vector3();
  const gold = new THREE.Color('#ffe0a0'), cool = new THREE.Color('#9fb6d6'), mist = new THREE.Color('#cfe0f2');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i); n.set(nrm.getX(i), nrm.getY(i), nrm.getZ(i));
    const d = n.dot(SUN); c.setRGB(.86 + Math.min(.16, y / 500), .88 + Math.min(.14, y / 500), .92 + Math.min(.1, y / 500));
    if (d > .15) c.lerp(gold, Math.min(.55, (d - .15) * 1.1)); else c.lerp(cool, Math.min(.35, (.15 - d) * .55));
    c.lerp(mist, Math.max(0, 1 - y / 30) * .5);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}

function build(mobile: boolean) {
  const r = rng(2024); const N = mobile ? 30 : 46;
  const glass: THREE.BufferGeometry[][] = PALETTES.map(() => []); const stone: THREE.BufferGeometry[] = [], metal: THREE.BufferGeometry[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + (r() - .5) * .18, rad = 150 + r() * 34;
    if (r() < .12) continue;                                     // a few gaps let the sky through like a real skyline
    const cx = Math.cos(a) * rad, cz = Math.sin(a) * rad, rot = -a + (r() - .5) * .25;
    const tall = (i % 7 === 3) ? 1 : r() > .72 ? .8 : .45 + r() * .3;       // a few landmark towers, many mid rise
    const H = 40 + tall * 50 + r() * 8, W = 13 + r() * 9, D = 13 + r() * 8;
    const pal = WEIGHTS[Math.floor(r() * WEIGHTS.length)]; const kind = Math.floor(r() * 4);
    const parts: THREE.BufferGeometry[] = []; const at = (g: THREE.BufferGeometry, y = 0) => { g.rotateY(rot); g.translate(cx, y, cz); return g; };
    const place = (w: number, h: number, d: number, dx: number, y0: number, dz: number) => { const g = body(w, h, d, dx, y0, dz); g.rotateY(rot); g.translate(cx, 0, cz); parts.push(g); };
    let top = H;
    if (kind === 0) { place(W, H, D, 0, 0, 0); }                                              // clean slab
    else if (kind === 1) { place(W, H * .62, D, 0, 0, 0); place(W * .8, H * .26, D * .8, 0, H * .62, 0); place(W * .56, H * .12, D * .56, 0, H * .88, 0); top = H; } // stepped
    else if (kind === 2) { place(W * 1.1, H * .7, D, 0, 0, 0); place(W * .62, H, D * .62, W * .22, 0, -D * .1); top = H; }       // podium plus shaft
    else { place(W, H, D, 0, 0, 0); place(W * .42, H * .18, D * .42, W * .3, H, D * .25); top = H * 1.18; }                     // tower with an offset core
    glass[pal].push(...parts.map(haze));
    // crown
    const cap = new THREE.BoxGeometry(W * (kind === 1 ? .6 : .9), 1.8, D * (kind === 1 ? .6 : .9)); cap.translate(0, top + .9, 0); stone.push(at(cap));
    if (kind === 1 || kind === 3 || i % 5 === 0) { const pyr = new THREE.ConeGeometry(Math.min(W, D) * (kind === 1 ? .34 : .42), 14 + r() * 10, 4); pyr.rotateY(Math.PI / 4); pyr.translate(0, top + .9 + 9, 0); metal.push(at(pyr)); }
    if (i % 3 === 0) { const s = new THREE.CylinderGeometry(.25, .6, 20 + r() * 26, 6); s.translate(0, top + 1 + 12, 0); metal.push(at(s)); }
    const pent = new THREE.BoxGeometry(W * .34, 4.6, D * .3); pent.translate(W * .1, top + 2.3 + 1.8, -D * .05); stone.push(at(pent));
  }
  return { glass: glass.map(list => (list.length ? mergeGeometries(list)! : null)), stone: mergeGeometries(stone)!, metal: mergeGeometries(metal)! };
}

export type SkylineMats = { glass: THREE.MeshStandardMaterial[]; stone: THREE.MeshStandardMaterial; metal: THREE.MeshStandardMaterial };

/** Shared materials so the real skyline and the mirrored copy are driven by one animation. */
export function useSkylineMats(): SkylineMats {
  return useMemo(() => ({
    glass: PALETTES.map((p, i) => new THREE.MeshStandardMaterial({ map: glassCanvas(p, false, 11 + i), emissive: '#ffffff', emissiveMap: glassCanvas(p, true, 31 + i), emissiveIntensity: 0, metalness: .55, roughness: .16, envMapIntensity: 1.7, vertexColors: true, fog: false })),
    stone: new THREE.MeshStandardMaterial({ color: '#d9d2c7', roughness: .7, fog: false }),
    metal: new THREE.MeshStandardMaterial({ color: '#c9d4dc', metalness: .8, roughness: .25, fog: false }),
  }), []);
}

const DAY = new THREE.Color('#ffffff'), NIGHT = new THREE.Color('#4a5688');
/** Drives day and night on the skyline materials. Mount once. */
export function SkylineClock({ mats }: { mats: SkylineMats }) {
  const mix = useContext(NightCtx);
  useFrame(() => {
    const m = mix.current;
    mats.glass.forEach(g => { g.emissiveIntensity = 1.25 * m * m; g.color.copy(DAY).lerp(NIGHT, m); g.envMapIntensity = 1.5 - 1.0 * m; });
    mats.stone.color.setRGB(.85 - .55 * m, .82 - .52 * m, .78 - .42 * m); mats.metal.color.setRGB(.79 - .5 * m, .83 - .5 * m, .86 - .42 * m);
  });
  return null;
}

export function Skyline({ mats, mobile }: { mats: SkylineMats; mobile: boolean }) {
  const geo = useMemo(() => build(mobile), [mobile]);
  return <group>
    {geo.glass.map((g, i) => g && <mesh key={i} geometry={g} material={mats.glass[i]} />)}
    <mesh geometry={geo.stone} material={mats.stone} />
    <mesh geometry={geo.metal} material={mats.metal} />
  </group>;
}
