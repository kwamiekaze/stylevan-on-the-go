import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { palette } from '@/config/brand';
import { rng } from './theme';

/* ---------------------------------------------------------------------------
 * Body panels with real wheel arch cut outs, so tires never pass through a wall
 * or floor. One outline drives the solid wall and the printed skin on top of it.
 * ------------------------------------------------------------------------- */

export type Arch = { a: number; b: number; cy: number; r: number }; // arch over wheel centres a..b
export type Rect = [number, number, number, number];                // x0, x1, y0, y1

export type SideSpec = {
  x0: number; x1: number; y0: number; y1: number; arches: Arch[];
  /** Points to walk after the bottom edge reaches x1, ending at the top front corner. */
  front?: [number, number][];
  holes: Rect[];
  /** Texture space: u runs uX0..uX1, v runs vY0..vY1 */
  uv: [number, number, number, number];
};

function outline(s: SideSpec) {
  const pts: [number, number][] = [[s.x0, s.y1], [s.x0, s.y0]];
  const N = 14;
  for (const a of [...s.arches].sort((p, q) => p.a - q.a)) {
    const th = Math.asin(Math.max(-1, Math.min(1, (s.y0 - a.cy) / a.r)));
    pts.push([a.a - a.r * Math.cos(th), s.y0]);
    for (let i = 1; i <= N; i++) { const ang = (Math.PI - th) - ((Math.PI / 2 - th) * i) / N; pts.push([a.a + a.r * Math.cos(ang), a.cy + a.r * Math.sin(ang)]); }
    if (a.b > a.a) pts.push([a.b, a.cy + a.r]);
    const cut = a.b + a.r * Math.cos(th) > s.x1;
    const end = cut ? Math.acos(Math.max(-1, Math.min(1, (s.x1 - a.b) / a.r))) : th;
    for (let i = 1; i <= N; i++) { const ang = Math.PI / 2 - ((Math.PI / 2 - end) * i) / N; pts.push([a.b + a.r * Math.cos(ang), a.cy + a.r * Math.sin(ang)]); }
    if (!cut) pts.push([a.b + a.r * Math.cos(th), s.y0]);
  }
  const last = pts[pts.length - 1];
  if (last[0] < s.x1 - 1e-4) pts.push([s.x1, s.y0]);
  if (s.front) pts.push(...s.front); else pts.push([s.x1, s.y1]);
  return pts;
}

function buildShape(s: SideSpec, mirror: boolean) {
  const m = mirror ? -1 : 1;
  const shape = new THREE.Shape(outline(s).map(([x, y]) => new THREE.Vector2(m * x, y)));
  for (const [a, b, c, d] of s.holes) shape.holes.push(new THREE.Path([[a, c], [b, c], [b, d], [a, d]].map(([x, y]) => new THREE.Vector2(m * x, y))));
  return shape;
}

function remapUV(g: THREE.BufferGeometry, s: SideSpec, mirror: boolean) {
  const [u0, u1, v0, v1] = s.uv; const p = g.attributes.position; const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = mirror ? -p.getX(i) : p.getX(i); uv.setXY(i, mirror ? (u1 - x) / (u1 - u0) : (x - u0) / (u1 - u0), (p.getY(i) - v0) / (v1 - v0)); }
  uv.needsUpdate = true;
}

/** Both side walls of a vehicle: solid painted wall plus printed skin. */
export function SideWalls({ plus, minus, z, t, paint, map }: { plus: SideSpec; minus: SideSpec; z: number; t: number; paint: THREE.Material; map: THREE.Texture }) {
  const geos = useMemo(() => [false, true].map(mirror => {
    const s = mirror ? minus : plus; const shape = buildShape(s, mirror);
    const wall = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 1 });
    const skin = new THREE.ShapeGeometry(shape, 1); remapUV(skin, s, mirror);
    return { wall, skin };
  }), [plus, minus, t]);
  const skinMat = useMemo(() => new THREE.MeshPhysicalMaterial({ map, roughness: .28, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.2 }), [map]);
  return <group>
    {geos.map((g, i) => <group key={i} rotation-y={i ? Math.PI : 0}>
      <mesh geometry={g.wall} material={paint} position-z={z - t} castShadow receiveShadow />
      <mesh geometry={g.skin} material={skinMat} position-z={z + .002} receiveShadow />
    </group>)}
  </group>;
}

/** Dark wheel well liner seen through an arch cut out. */
export function WheelWell({ x, cy, r, z0, z1, b = x }: { x: number; cy: number; r: number; z0: number; z1: number; b?: number }) {
  const len = Math.abs(z1 - z0), zc = (z0 + z1) / 2;
  return <group>
    {[x, b].filter((v, i, a) => a.indexOf(v) === i).map(cx => <mesh key={cx} position={[cx, cy, zc]} rotation-x={Math.PI / 2}><cylinderGeometry args={[r, r, len, 28, 1, true, -Math.PI / 2, Math.PI]} /><meshStandardMaterial color="#141112" roughness={.95} side={THREE.DoubleSide} /></mesh>)}
    {b > x && <mesh position={[(x + b) / 2, cy + r, zc]} rotation-x={Math.PI / 2}><planeGeometry args={[b - x, len]} /><meshStandardMaterial color="#141112" roughness={.95} side={THREE.DoubleSide} /></mesh>}
  </group>;
}

/* ---------------------------------------------------------------------------
 * Wheels: radial tire with tread, white steel disc wheel with hand holes,
 * lug nuts and a chrome hub. Shared geometry and textures keep it cheap.
 * ------------------------------------------------------------------------- */

/** How far a loaded tire flattens at the contact patch (m). The vehicles sit on the ground by this amount. */
export const TIRE_SQUASH = .006;

let shadowTex: THREE.CanvasTexture | null = null;
/** Soft contact shadow: a dark core where rubber meets the floor fading out over a few centimetres. */
function contactTex() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.35, 'rgba(0,0,0,.85)'); gr.addColorStop(.7, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); shadowTex = new THREE.CanvasTexture(c); return shadowTex;
}
let shadowMat: THREE.MeshBasicMaterial | null = null;
function contactMat() {
  if (!shadowMat) shadowMat = new THREE.MeshBasicMaterial({ map: contactTex(), color: '#000', transparent: true, opacity: .62, depthWrite: false, toneMapped: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  return shadowMat;
}

let treadTex: THREE.CanvasTexture | null = null;
function tread() {
  if (treadTex) return treadTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d')!;
  g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, 64, 256);
  g.fillStyle = '#303030';
  [.34, .45, .55, .66].forEach(v => g.fillRect(0, v * 256 - 3, 64, 6));                  // circumferential grooves
  for (let i = 0; i < 4; i++) { g.save(); g.translate(0, (.3 + i * .105) * 256); g.fillRect(8 + (i % 2) * 20, 0, 5, 22); g.restore(); } // sipes
  g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, 64, 70); g.fillRect(0, 186, 64, 70);          // smooth sidewalls
  treadTex = new THREE.CanvasTexture(c); treadTex.wrapS = treadTex.wrapT = THREE.RepeatWrapping; treadTex.repeat.set(36, 1); treadTex.anisotropy = 8;
  return treadTex;
}

let faceTex: THREE.CanvasTexture | null = null;
/** White steel disc wheel face, 8 hand holes. */
function wheelFace() {
  if (faceTex) return faceTex;
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!; const C = S / 2;
  const disc = g.createRadialGradient(C * .8, C * .75, C * .1, C, C, C);
  disc.addColorStop(0, '#ffffff'); disc.addColorStop(.7, '#f1eeea'); disc.addColorStop(1, '#d9d5cf');
  g.fillStyle = disc; g.beginPath(); g.arc(C, C, C, 0, Math.PI * 2); g.fill();
  const ring = (r: number, w: number, col: string) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.stroke(); };
  ring(C * .97, C * .05, '#c9c4bd'); ring(C * .9, C * .02, '#e8e4de'); ring(C * .84, C * .012, '#bdb7af');
  ring(C * .46, C * .02, '#cfcac3'); ring(C * .3, C * .03, '#bfb9b1');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8, x = C + Math.cos(a) * C * .66, y = C + Math.sin(a) * C * .66;
    g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
    const hg = g.createLinearGradient(0, -C * .07, 0, C * .07); hg.addColorStop(0, '#0e0c0d'); hg.addColorStop(1, '#3a3536');
    g.fillStyle = hg; g.beginPath(); g.ellipse(0, 0, C * .13, C * .075, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, C * .135, C * .08, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.restore();
  }
  g.fillStyle = '#2c2829'; g.beginPath(); g.arc(C, C, C * .18, 0, Math.PI * 2); g.fill();
  faceTex = new THREE.CanvasTexture(c); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 8;
  return faceTex;
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function tireGeo(R: number, W: number, rimK: number) {
  const k = `t${R}${W}${rimK}`; if (geoCache.has(k)) return geoCache.get(k)!;
  // Radial tire section: flat tread, tight rounded shoulders, sidewall no wider than the tread
  // (a touch of crown only), bead seated on the rim flange. Normals come from the lathe itself.
  const h = W / 2, rim = R * rimK, sw = R - rim;
  const prof: [number, number][] = [
    [rim - .004, -h + .018], [rim + sw * .12, -h + .002], [rim + sw * .45, -h - .002], [rim + sw * .75, -h + .001],
    [R - .022, -h + .008], [R - .008, -h + .02], [R - .002, -h + .034], [R, -h + .05],
    [R, h - .05], [R - .002, h - .034], [R - .008, h - .02], [R - .022, h - .008],
    [rim + sw * .75, h - .001], [rim + sw * .45, h + .002], [rim + sw * .12, h - .002], [rim - .004, h - .018],
  ];
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 72);
  // A loaded tire sits on a small flat contact patch rather than a knife edge. Only the few
  // vertices in the patch move (by at most TIRE_SQUASH); lathe normals are kept, so shading stays smooth.
  const p = g.getAttribute('position') as THREE.BufferAttribute, flat = R - TIRE_SQUASH;
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i); if (z > flat) p.setZ(i, flat); } // wheel frame: local +z is world down
  p.needsUpdate = true;
  // Tread texture runs across the width: v by lateral position so grooves land on the tread, not the sidewall.
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setY(i, Math.min(1, Math.max(0, (p.getY(i) + h) / W)));
  uv.needsUpdate = true;
  geoCache.set(k, g); return g;
}
function lugGeo(n: number, br: number) {
  const k = `l${n}${br}`; if (geoCache.has(k)) return geoCache.get(k)!;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const c = new THREE.CylinderGeometry(.013, .015, .03, 6); c.translate(Math.cos(a) * br, 0, Math.sin(a) * br); parts.push(c); }
  const g = mergeGeometries(parts)!; geoCache.set(k, g); return g;
}

const tireMat = () => new THREE.MeshStandardMaterial({ color: '#1a1819', roughness: .88, bumpMap: tread(), bumpScale: .7 });
const faceMat = () => new THREE.MeshPhysicalMaterial({ map: wheelFace(), roughness: .32, clearcoat: .6, metalness: .05 });
let mats: { tire: THREE.Material; face: THREE.Material; barrel: THREE.Material; chrome: THREE.Material; lip: THREE.Material } | null = null;
function wheelMats() {
  if (!mats) mats = { tire: tireMat(), face: faceMat(), barrel: new THREE.MeshStandardMaterial({ color: '#cfcac3', roughness: .4, metalness: .3 }), chrome: new THREE.MeshStandardMaterial({ color: '#e9e9e9', metalness: 1, roughness: .12 }), lip: new THREE.MeshStandardMaterial({ color: '#f2efea', roughness: .3, metalness: .15 }) };
  return mats;
}

/** One wheel. Axis is world z. `s` is the outward side (1 = +z). `dual` adds an inner tire behind it. */
export function Wheel({ x, y, z, s, R = .42, W = .22, rimK = .6, dual = false, dome = false, spin = 0, shadow = true }: { x: number; y: number; z: number; s: 1 | -1; R?: number; W?: number; rimK?: number; dual?: boolean; dome?: boolean; spin?: number; shadow?: boolean }) {
  const m = wheelMats(); const rim = R * rimK;
  const tire = tireGeo(R, W, rimK), lugs = lugGeo(8, rim * .42);
  const face = s * (W / 2 - .045);
  const span = dual ? 2 * W + .02 : W;
  return <group position={[x, y, z]}>
    {/* contact shadow on the floor, just under the flattened tread (floor is at wheel bottom + squash - lift) */}
    {shadow && <mesh position={[0, -(R - TIRE_SQUASH) - .0012, dual ? -s * (W + .02) / 2 : 0]} rotation-x={-Math.PI / 2} material={contactMat()} renderOrder={3}><planeGeometry args={[R * 1.25, span + .1]} /></mesh>}
  <group rotation-x={Math.PI / 2}>
    <group rotation-y={spin}>
      <mesh geometry={tire} material={m.tire} castShadow />
      {dual && <mesh geometry={tire} material={m.tire} position-y={-s * (W + .02)} castShadow />}
      <mesh position-y={face / 2 + s * .01} material={m.barrel}><cylinderGeometry args={[rim, rim, Math.abs(face) + .02, 32, 1, true]} /></mesh>
      <mesh position-y={s * (W / 2 - .012)} rotation-x={Math.PI / 2} material={m.lip}><torusGeometry args={[rim - .004, .012, 8, 36]} /></mesh>
      <mesh position-y={face} rotation-x={s > 0 ? -Math.PI / 2 : Math.PI / 2} material={m.face}><circleGeometry args={[rim - .01, 40]} /></mesh>
      <mesh geometry={lugs} material={m.chrome} position-y={face + s * .014} />
      <mesh position-y={face + s * .01} scale={[1, dome ? .8 : .35, 1]} material={m.chrome}><sphereGeometry args={[rim * .2, 20, 12, 0, Math.PI * 2, s > 0 ? 0 : Math.PI / 2, Math.PI / 2]} /></mesh>
    </group>
  </group>
  </group>;
}

/* ---------------------------------------------------------------------------
 * Paint for the printed sides: soft blush waves and gold hairlines.
 * ------------------------------------------------------------------------- */
export function paintWaves(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, band = .78) {
  const r = rng(seed); const j = (k: number) => (r() - .5) * k;
  const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#fdf9f5'); bg.addColorStop(1, palette.ivory);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const wave = (top: number, amp: number, fill: string | CanvasGradient, alpha: number) => {
    ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(0, h * (top + j(.02)));
    ctx.bezierCurveTo(w * .22, h * (top - amp), w * .42, h * (top + amp * 1.1), w * .62, h * (top + j(.03)));
    ctx.bezierCurveTo(w * .8, h * (top - amp), w * .9, h * (top + amp * .4), w, h * (top - amp * .5));
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  };
  const g1 = ctx.createLinearGradient(0, h * band, 0, h); g1.addColorStop(0, '#efcfc8'); g1.addColorStop(1, '#dfb0a6');
  wave(band, .08, g1, 1);
  wave(band + .07, .06, '#f8e6e1', .6);
  wave(band + .13, .05, '#e6bdb4', .7);
  const line = (top: number, amp: number, lw: number, a: number) => {
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = palette.gold; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(0, h * top);
    ctx.bezierCurveTo(w * .22, h * (top - amp), w * .42, h * (top + amp * 1.1), w * .62, h * top);
    ctx.bezierCurveTo(w * .8, h * (top - amp), w * .9, h * (top + amp * .4), w, h * (top - amp * .5)); ctx.stroke(); ctx.restore();
  };
  line(band - .012, .08, Math.max(2, h * .004), .9);
  line(band + .05, .07, Math.max(1.2, h * .0022), .6);
}

/* ---------------------------------------------------------------------------
 * Rear barn doors, opening outward toward -x.
 * ------------------------------------------------------------------------- */
export function RearDoors({ x, oz, y0, y1, open, map, lining }: { x: number; oz: number; y0: number; y1: number; open: boolean; map: THREE.Texture; lining: string }) {
  const halves = useMemo(() => [0, .5].map(off => { const t = map.clone(); t.repeat.set(.5, 1); t.offset.set(off, 0); t.needsUpdate = true; return t; }), [map]);
  const refs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  useFrame((_, dt) => refs.forEach((g, i) => { if (g.current) g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, open ? (i ? 1 : -1) * 1.95 : 0, 3, Math.min(dt, .05)); }));
  const H = y1 - y0 - .02, W = oz + .02;
  const gold = palette.goldBright;
  return <group>
    {[-1, 1].map((s, i) => <group key={s} ref={refs[i]} position={[x - .01, (y0 + y1) / 2, s * (oz + .02)]}>
      <group position={[0, 0, -s * W / 2]}>
        <mesh position-x={-.02}><boxGeometry args={[.05, H, W - .01]} /><meshPhysicalMaterial color={palette.ivory} roughness={.24} clearcoat={1} /></mesh>
        <mesh position-x={-.047} rotation-y={-Math.PI / 2}><planeGeometry args={[W - .02, H - .02]} /><meshPhysicalMaterial map={s < 0 ? halves[0] : halves[1]} roughness={.3} clearcoat={1} clearcoatRoughness={.1} /></mesh>
        <mesh position-x={.006}><boxGeometry args={[.012, H - .06, W - .06]} /><meshStandardMaterial color={lining} roughness={.8} /></mesh>
        <mesh position={[-.056, -H / 2 + .02, 0]}><boxGeometry args={[.008, .02, W - .02]} /><meshStandardMaterial color={gold} metalness={.9} roughness={.2} /></mesh>
        <mesh position={[-.06, -.1, -s * (W / 2 - .07)]}><boxGeometry args={[.025, .36, .03]} /><meshStandardMaterial color="#dcdcdc" metalness={1} roughness={.12} /></mesh>
        {[-H / 2 + .25, H / 2 - .25].map(yy => <mesh key={yy} position={[-.055, yy, s * (W / 2 - .03)]}><boxGeometry args={[.02, .12, .05]} /><meshStandardMaterial color="#bdb7af" metalness={.8} roughness={.3} /></mesh>)}
      </group>
    </group>)}
  </group>;
}
