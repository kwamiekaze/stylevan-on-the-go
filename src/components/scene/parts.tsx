import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, RoundedBox } from '@react-three/drei';
import { palette } from '@/config/brand';

export type V3 = [number, number, number];

type BoxProps = {
  p: V3; s: V3; c: string; m?: number; r?: number; cast?: boolean; rot?: V3;
  e?: string; ei?: number; radius?: number; clearcoat?: number; opacity?: number;
};

/** Rounded box primitive used everywhere. `radius` 0 gives a hard edge. */
export function Box({ p, s, c, m = 0, r = .5, cast = true, rot, e, ei = 0, radius = .012, clearcoat = 0, opacity }: BoxProps) {
  const transparent = opacity !== undefined;
  // Thin shiny trim glints and crawls when the camera moves (specular aliasing). Keep it looking like brushed metal, not a mirror.
  const thin = m > .6 && Math.min(...s) < .1;
  if (thin) { m = .5; r = Math.max(r, .45); }
  const mat = <meshPhysicalMaterial color={c} metalness={m} roughness={r} envMapIntensity={thin ? .55 : 1} emissive={e ?? '#000000'} emissiveIntensity={ei} clearcoat={clearcoat} clearcoatRoughness={.15} transparent={transparent} opacity={opacity ?? 1} />;
  if (radius > 0) return <RoundedBox args={s} radius={Math.min(radius, Math.min(...s) / 2 - .001)} smoothness={3} position={p} rotation={rot} castShadow={cast} receiveShadow>{mat}</RoundedBox>;
  return <mesh position={p} rotation={rot} castShadow={cast} receiveShadow><boxGeometry args={s} />{mat}</mesh>;
}

export function Cyl({ p, r, h, c, m = 0, rough = .5, rot, seg = 24, e, ei = 0 }: { p: V3; r: number; h: number; c: string; m?: number; rough?: number; rot?: V3; seg?: number; e?: string; ei?: number }) {
  return <mesh position={p} rotation={rot} castShadow receiveShadow><cylinderGeometry args={[r, r, h, seg]} /><meshStandardMaterial color={c} metalness={m} roughness={rough} emissive={e ?? '#000'} emissiveIntensity={ei} /></mesh>;
}

export function Ball({ p, r, c, e, ei = 0, sy = 1, m = 0, rough = .6 }: { p: V3; r: number; c: string; e?: string; ei?: number; sy?: number; m?: number; rough?: number }) {
  return <mesh position={p} scale={[1, sy, 1]} castShadow><sphereGeometry args={[r, 16, 12]} /><meshStandardMaterial color={c} emissive={e ?? '#000'} emissiveIntensity={ei} metalness={m} roughness={rough} /></mesh>;
}

/**
 * A rectangular region of one big livery texture, applied to its own plane.
 * `total` is the world rect the whole texture spans, `seg` the sub rect this
 * plane covers: [x0, x1, y0, y1]. Sharing one texture means editing brand.ts
 * repaints every piece at once.
 */
export function TexPlane({ map, total, seg, z = 0, flip = false, rough = .3 }: { map: THREE.Texture; total: [number, number, number, number]; seg: [number, number, number, number]; z?: number; flip?: boolean; rough?: number }) {
  const geo = useMemo(() => {
    const [tx0, tx1, ty0, ty1] = total; const [sx0, sx1, sy0, sy1] = seg;
    const W = tx1 - tx0, H = ty1 - ty0;
    const g = new THREE.PlaneGeometry(sx1 - sx0, sy1 - sy0);
    const u0 = flip ? (tx1 - sx1) / W : (sx0 - tx0) / W;
    const u1 = flip ? (tx1 - sx0) / W : (sx1 - tx0) / W;
    const v0 = (sy0 - ty0) / H, v1 = (sy1 - ty0) / H;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
    return g;
  }, [total, seg, flip]);
  return <mesh geometry={geo} position={[(seg[0] + seg[1]) / 2, (seg[2] + seg[3]) / 2, z]} rotation-y={flip ? Math.PI : 0} receiveShadow>
    <meshPhysicalMaterial map={map} roughness={rough} clearcoat={1} clearcoatRoughness={.1} />
  </mesh>;
}

const tireGeo = (() => { const pts = [[.27, -.115], [.36, -.12], [.425, -.105], [.455, -.06], [.46, 0], [.455, .06], [.425, .105], [.36, .12], [.27, .115]].map(([r, y]) => new THREE.Vector2(r, y)); return new THREE.LatheGeometry(pts, 40); })();
const tireMat = new THREE.MeshStandardMaterial({ color: '#141213', roughness: .92 });
const rimMat = new THREE.MeshStandardMaterial({ color: '#f1d9ae', metalness: 1, roughness: .16 });
const goldMat = new THREE.MeshStandardMaterial({ color: palette.goldBright, metalness: 1, roughness: .2 });
const discMat = new THREE.MeshStandardMaterial({ color: '#4a4648', metalness: .9, roughness: .4 });

/** Tire with sidewall, ten spoke gold rim, brake disc and caliper. Axis is local Y after the group rotation. */
export function Wheel({ x, z, radius = .44, out = 1 }: { x: number; z: number; radius?: number; out?: number }) {
  const k = radius / .46;
  return <group position={[x, radius, z]} rotation-x={Math.PI / 2} scale={k}>
    <mesh geometry={tireGeo} material={tireMat} castShadow />
    <mesh position={[0, .07 * out, 0]} material={rimMat}><cylinderGeometry args={[.285, .285, .05, 32]} /></mesh>
    <mesh position={[0, .1 * out, 0]} rotation-x={Math.PI / 2} material={goldMat}><torusGeometry args={[.28, .02, 8, 32]} /></mesh>
    {Array.from({ length: 10 }).map((_, i) => <mesh key={i} position={[0, .1 * out, 0]} rotation={[0, (i * Math.PI * 2) / 10, 0]} material={rimMat}><boxGeometry args={[.5, .022, .04]} /></mesh>)}
    <mesh position={[0, .11 * out, 0]} material={goldMat}><cylinderGeometry args={[.07, .07, .03, 20]} /></mesh>
    <mesh position={[0, -.06 * out, 0]} material={discMat}><cylinderGeometry args={[.21, .21, .025, 28]} /></mesh>
    <mesh position={[.17, -.02 * out, .06]} material={goldMat}><boxGeometry args={[.1, .05, .09]} /></mesh>
  </group>;
}

export function WheelArch({ x, z, radius = .5 }: { x: number; z: number; radius?: number }) {
  return <mesh position={[x, radius, z]} rotation-x={Math.PI / 2}><cylinderGeometry args={[radius, radius, .02, 32]} /><meshStandardMaterial color="#0f0d0e" roughness={.8} /></mesh>;
}

export function Plant({ p, s = 1 }: { p: V3; s?: number }) {
  const leaves: [number, number, number, number][] = [[0, .32, 0, .2], [.09, .26, .04, .15], [-.08, .28, -.05, .16], [.02, .42, -.05, .14], [-.03, .22, .08, .13]];
  return <group position={p} scale={s}>
    <Cyl p={[0, .09, 0]} r={.09} h={.18} c={palette.cream} rough={.4} />
    {leaves.map(([x, y, z, r], i) => <Ball key={i} p={[x, y, z]} r={r} sy={1.4} c={i % 2 ? '#5f8060' : '#4f7355'} rough={.7} />)}
  </group>;
}

export function Mirror({ p, w = .95, h = 1.25, rot }: { p: V3; w?: number; h?: number; rot?: V3 }) {
  const bulbs: V3[] = [];
  const nx = Math.round(w / .13), ny = Math.round(h / .14);
  for (let i = 0; i <= ny; i++) { const y = -h / 2 + (h / ny) * i; bulbs.push([-w / 2 - .02, y, .03], [w / 2 + .02, y, .03]); }
  for (let i = 1; i < nx; i++) { const x = -w / 2 + (w / nx) * i; bulbs.push([x, h / 2 + .02, .03]); }
  return <group position={p} rotation={rot}>
    <Box p={[0, 0, 0]} s={[w + .1, h + .1, .05]} c={palette.gold} m={.85} r={.25} />
    <mesh position={[0, 0, .028]}><planeGeometry args={[w, h]} /><meshStandardMaterial color="#e8eef2" metalness={1} roughness={.04} /></mesh>
    {bulbs.map((b, i) => <mesh key={i} position={b}><sphereGeometry args={[.025, 8, 6]} /><meshStandardMaterial color="#ffe6bf" emissive="#ffc880" emissiveIntensity={3} /></mesh>)}
  </group>;
}

/** Faces +z by default. Rotate the group to point it. */
export function BarberChair({ p, rot }: { p: V3; rot?: V3 }) {
  return <group position={p} rotation={rot}>
    <Cyl p={[0, .03, 0]} r={.3} h={.06} c={palette.charcoal} rough={.35} />
    <Cyl p={[0, .07, 0]} r={.31} h={.02} c={palette.goldBright} m={1} rough={.2} />
    <Cyl p={[0, .26, 0]} r={.07} h={.4} c="#e9d3a8" m={1} rough={.2} />
    <Box p={[0, .52, 0]} s={[.62, .15, .6]} c={palette.charcoal} r={.3} radius={.05} clearcoat={.6} />
    <Box p={[0, .95, -.28]} s={[.6, .78, .13]} c={palette.charcoal} r={.3} radius={.05} rot={[-.14, 0, 0]} clearcoat={.6} />
    <Box p={[0, 1.42, -.33]} s={[.32, .18, .1]} c={palette.charcoal} r={.3} radius={.04} rot={[-.14, 0, 0]} />
    {[-1, 1].map(sx => <group key={sx}>
      <Box p={[sx * .35, .72, -.02]} s={[.07, .06, .5]} c={palette.goldBright} m={1} r={.2} radius={.02} />
      <Box p={[sx * .35, .62, .2]} s={[.05, .2, .05]} c={palette.goldBright} m={1} r={.2} radius={.01} />
    </group>)}
    <Box p={[0, .3, .5]} s={[.46, .05, .3]} c={palette.charcoal} r={.3} radius={.02} rot={[.35, 0, 0]} />
    <Box p={[0, .3, .52]} s={[.48, .02, .05]} c={palette.goldBright} m={1} r={.2} radius={.005} />
  </group>;
}

/** Pink velvet styling stool, faces +z. */
export function PlushChair({ p, rot, h = .42 }: { p: V3; rot?: V3; h?: number }) {
  return <group position={p} rotation={rot}>
    <Cyl p={[0, .02, 0]} r={.24} h={.04} c={palette.goldBright} m={1} rough={.2} />
    <Cyl p={[0, h / 2, 0]} r={.05} h={h} c="#e9d3a8" m={1} rough={.2} />
    <Cyl p={[0, h + .06, 0]} r={.25} h={.12} c={palette.blushDeep} rough={.95} />
    <Box p={[0, h + .3, -.2]} s={[.44, .3, .09]} c={palette.blushDeep} r={.95} radius={.04} rot={[-.1, 0, 0]} />
  </group>;
}

export function Sofa({ p, rot, w = 1.7 }: { p: V3; rot?: V3; w?: number }) {
  return <group position={p} rotation={rot}>
    <Box p={[0, .3, 0]} s={[w, .3, .78]} c={palette.blushDeep} r={.95} radius={.07} />
    <Box p={[0, .58, -.3]} s={[w, .5, .2]} c={palette.blushDeep} r={.95} radius={.08} rot={[-.08, 0, 0]} />
    {[-1, 1].map(sx => <Box key={sx} p={[sx * (w / 2 - .07), .45, 0]} s={[.16, .35, .78]} c={palette.rose} r={.95} radius={.06} />)}
    {[-1, 1].map(sx => [-1, 1].map(sz => <Cyl key={`${sx}${sz}`} p={[sx * (w / 2 - .1), .07, sz * .3]} r={.03} h={.14} c={palette.goldBright} m={1} rough={.2} />))}
    {[-.4, .4].map(x => <Box key={x} p={[x, .52, .05]} s={[.4, .3, .1]} c="#f7e7de" r={.9} radius={.05} rot={[-.25, .1, 0]} />)}
  </group>;
}

export function Dress({ p, tint = '#fbf6ef' }: { p: V3; tint?: string }) {
  return <group position={p}>
    <mesh position={[0, .0, 0]}><torusGeometry args={[.05, .01, 6, 12, Math.PI]} /><meshStandardMaterial color={palette.goldBright} metalness={1} roughness={.2} /></mesh>
    <mesh position={[0, -.42, 0]} castShadow><cylinderGeometry args={[.07, .14, .5, 14]} /><meshStandardMaterial color={tint} roughness={.85} /></mesh>
    <mesh position={[0, -1.0, 0]} castShadow><cylinderGeometry args={[.14, .36, .7, 18]} /><meshStandardMaterial color={tint} roughness={.9} /></mesh>
  </group>;
}

export function Bottles({ p, n = 8, span = .8 }: { p: V3; n?: number; span?: number }) {
  const colors = ['#e9bfc0', '#c39a62', '#f6ede4', '#7a3c4a', '#d9a4ab', '#f0d9b0'];
  return <group position={p}>
    {Array.from({ length: n }).map((_, i) => {
      const h = .1 + ((i * 37) % 5) * .018;
      return <mesh key={i} position={[-span / 2 + (span / (n - 1)) * i, h / 2, 0]} castShadow><cylinderGeometry args={[.028, .032, h, 10]} /><meshStandardMaterial color={colors[i % colors.length]} roughness={.35} metalness={.2} /></mesh>;
    })}
  </group>;
}

export function GlowStrip({ p, s }: { p: V3; s: V3 }) {
  return <mesh position={p}><boxGeometry args={s} /><meshStandardMaterial color="#ffe9c7" emissive="#ffc27a" emissiveIntensity={2.6} /></mesh>;
}


/** Flat quad from four points, double sided. */
export function Quad({ pts, color, m = .9, r = .05, e, ei = 0, coat = 1 }: { pts: [V3, V3, V3, V3]; color: string; m?: number; r?: number; e?: string; ei?: number; coat?: number }) {
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; }, [pts]);
  return <mesh geometry={geo}><meshPhysicalMaterial color={color} metalness={m} roughness={r} clearcoat={coat} side={THREE.DoubleSide} emissive={e ?? '#000'} emissiveIntensity={ei} envMapIntensity={1.4} /></mesh>;
}

/** A mirror that becomes a true planar reflection when the camera is close, and a bright metal pane otherwise. */
export function MirrorReal({ p, w = .95, h = 1.25, rot, near = 6 }: { p: V3; w?: number; h?: number; rot?: V3; near?: number }) {
  const g = useRef<THREE.Group>(null);
  // Live reflection mounts only near the mirror (it re-renders the scene every frame), with hysteresis so
  // it never chatters on and off at the threshold. The polished stand-in stays visible for the first few
  // frames after mounting, so the swap never shows an empty render target.
  const [armed, setArmed] = useState(false);
  const liveG = useRef<THREE.Group>(null), still = useRef<THREE.Mesh>(null);
  const on = useRef(false), frames = useRef(0);
  const mobile = useThree(s => s.size.width < 900);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!g.current) return;
    g.current.getWorldPosition(v); const d = camera.position.distanceTo(v);
    if (!on.current && d < near) on.current = true; else if (on.current && d > near + 1.5) on.current = false;
    if (on.current !== armed) { setArmed(on.current); frames.current = 0; }
    if (armed) frames.current++;
    const ready = armed && frames.current > 3;
    if (liveG.current) liveG.current.visible = ready;
    if (still.current) still.current.visible = !ready;
  });
  const bulbs = useMemo(() => { const out: V3[] = []; const nx = Math.round(w / .13), ny = Math.round(h / .14); for (let i = 0; i <= ny; i++) { const y = -h / 2 + (h / ny) * i; out.push([-w / 2 - .035, y, .04], [w / 2 + .035, y, .04]); } for (let i = 1; i < nx; i++) out.push([-w / 2 + (w / nx) * i, h / 2 + .035, .04]); return out; }, [w, h]);
  return <group ref={g} position={p} rotation={rot}>
    <Box p={[0, 0, 0]} s={[w + .14, h + .14, .05]} c={palette.gold} m={.9} r={.22} radius={.03} />
    <mesh ref={still} position={[0, 0, .03]}><planeGeometry args={[w, h]} /><meshStandardMaterial color="#e6eef3" metalness={1} roughness={.03} envMapIntensity={1.4} /></mesh>
    {armed && <group ref={liveG} visible={false}><mesh position={[0, 0, .031]}><planeGeometry args={[w, h]} /><MeshReflectorMaterial mirror={1} resolution={mobile ? 384 : 640} blur={[0, 0]} mixBlur={0} mixStrength={1.05} roughness={0} depthScale={0} color="#f4f8fb" metalness={0} /></mesh></group>}
    {bulbs.map((b, i) => <mesh key={i} position={b}><sphereGeometry args={[.026, 8, 6]} /><meshStandardMaterial color="#ffe6bf" emissive="#ffc880" emissiveIntensity={3.2} /></mesh>)}
  </group>;
}

/** Ceramic shampoo bowl with a gold faucet. Faces +z. */
export function ShampooBowl({ p }: { p: V3 }) {
  const geo = useMemo(() => new THREE.LatheGeometry([[0, 0], [.16, .01], [.24, .07], [.27, .16], [.28, .17], [.26, .17], [.22, .09], [.14, .04], [0, .03]].map(([r, y]) => new THREE.Vector2(r, y)), 32), []);
  return <group position={p}>
    <mesh geometry={geo} rotation-x={.12} scale={[1.2, 1, 1]}><meshPhysicalMaterial color="#ffffff" roughness={.08} clearcoat={1} /></mesh>
    <Cyl p={[0, .22, -.24]} r={.018} h={.44} c={palette.goldBright} m={1} rough={.15} />
    <mesh position={[0, .43, -.15]} rotation={[0, 0, 0]}><torusGeometry args={[.09, .014, 8, 16, Math.PI]} /><meshStandardMaterial color={palette.goldBright} metalness={1} roughness={.15} /></mesh>
    <mesh position={[.18, .2, -.05]} rotation={[.4, 0, .3]}><torusGeometry args={[.1, .012, 8, 20, Math.PI * 1.4]} /><meshStandardMaterial color="#c9c2bd" metalness={.8} roughness={.3} /></mesh>
  </group>;
}

/** Row of small polish bottles. */
export function PolishRack({ p, rows = 2, n = 8, w = .5 }: { p: V3; rows?: number; n?: number; w?: number }) {
  const cols = ['#e9bfc0', '#c9302c', '#f6e3d4', '#7a3c4a', '#f2a6b8', '#d8b26a', '#b7a4d8', '#fff'];
  return <group position={p}>
    <Box p={[0, 0, 0]} s={[w + .06, .02, .09 * rows + .04]} c={palette.gold} m={.9} r={.2} radius={.006} />
    {Array.from({ length: rows }).flatMap((_, r) => Array.from({ length: n }).map((__, i) => <group key={`${r}${i}`} position={[-w / 2 + (w / (n - 1)) * i, .04, (r - (rows - 1) / 2) * .085]}>
      <mesh><cylinderGeometry args={[.017, .019, .06, 8]} /><meshPhysicalMaterial color={cols[(i + r * 3) % cols.length]} roughness={.15} clearcoat={1} /></mesh>
      <mesh position={[0, .045, 0]}><cylinderGeometry args={[.011, .011, .03, 8]} /><meshStandardMaterial color="#20191b" roughness={.4} /></mesh>
    </group>))}
  </group>;
}

export function Vase({ p, s = 1, bloom = '#f4b6c6' }: { p: V3; s?: number; bloom?: string }) {
  const stems = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ a: (i / 9) * 6.28, r: .05 + (i % 3) * .03, h: .2 + (i % 4) * .04 })), []);
  return <group position={p} scale={s}>
    <mesh position={[0, .09, 0]}><cylinderGeometry args={[.05, .07, .18, 14]} /><meshPhysicalMaterial color="#f9f4ee" roughness={.05} clearcoat={1} transmission={0} /></mesh>
    <mesh position={[0, .181, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[.05, .008, 6, 16]} /><meshStandardMaterial color={palette.goldBright} metalness={1} roughness={.2} /></mesh>
    {stems.map((q, i) => <group key={i}>
      <mesh position={[Math.cos(q.a) * q.r * .5, .28, Math.sin(q.a) * q.r * .5]} rotation={[Math.sin(q.a) * .4, 0, -Math.cos(q.a) * .4]}><cylinderGeometry args={[.004, .004, .22, 4]} /><meshStandardMaterial color="#5c8a5a" /></mesh>
      <mesh position={[Math.cos(q.a) * q.r, .4 + q.h * .2, Math.sin(q.a) * q.r]}><icosahedronGeometry args={[.045, 1]} /><meshStandardMaterial color={i % 3 ? bloom : '#fff3f6'} roughness={.6} /></mesh>
    </group>)}
  </group>;
}

export function Towels({ p, n = 4 }: { p: V3; n?: number }) {
  return <group position={p}>{Array.from({ length: n }).map((_, i) => <Box key={i} p={[0, i * .075 + .035, 0]} s={[.42, .07, .3]} c={i % 2 ? '#fbf3ea' : '#f4d5d8'} r={.95} radius={.03} />)}</group>;
}

export function RingLight({ p, rot }: { p: V3; rot?: V3 }) {
  return <group position={p} rotation={rot}>
    <mesh><torusGeometry args={[.2, .018, 10, 40]} /><meshStandardMaterial color="#fff" emissive="#fff0da" emissiveIntensity={2.6} /></mesh>
    <mesh position={[0, 0, -.01]}><torusGeometry args={[.2, .026, 8, 40]} /><meshStandardMaterial color={palette.charcoal} roughness={.4} /></mesh>
  </group>;
}


const fenderPaint = new THREE.MeshPhysicalMaterial({ color: palette.ivory, roughness: .24, clearcoat: 1, side: THREE.DoubleSide, envMapIntensity: 1.25 });
const flareRubber = new THREE.MeshStandardMaterial({ color: '#141213', roughness: .85, side: THREE.DoubleSide });

/** Arch over a wheel: painted shell, dark liner and a rubber flare lip. Wheel centre is (x, r, z). */
export function Fender({ x, z, r = .44, len = .36 }: { x: number; z: number; r?: number; len?: number }) {
  const R = r + .07;
  return <group position={[x, r, z]} rotation-x={Math.PI / 2}>
    <mesh material={fenderPaint} castShadow><cylinderGeometry args={[R, R, len, 36, 1, true, Math.PI / 2, Math.PI]} /></mesh>
    <mesh material={flareRubber}><cylinderGeometry args={[R - .04, R - .04, len - .02, 36, 1, true, Math.PI / 2, Math.PI]} /></mesh>
    <mesh position={[0, len / 2, 0]} rotation-x={Math.PI / 2} material={flareRubber}><torusGeometry args={[R + .012, .016, 6, 36, Math.PI]} /></mesh>
    <mesh position={[0, -len / 2, 0]} rotation-x={Math.PI / 2} material={flareRubber}><torusGeometry args={[R + .012, .016, 6, 36, Math.PI]} /></mesh>
  </group>;
}
