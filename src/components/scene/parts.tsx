import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { palette } from '@/config/brand';

export type V3 = [number, number, number];

type BoxProps = {
  p: V3; s: V3; c: string; m?: number; r?: number; cast?: boolean; rot?: V3;
  e?: string; ei?: number; radius?: number; clearcoat?: number; opacity?: number;
};

/** Rounded box primitive used everywhere. `radius` 0 gives a hard edge. */
export function Box({ p, s, c, m = 0, r = .5, cast = true, rot, e, ei = 0, radius = .012, clearcoat = 0, opacity }: BoxProps) {
  const transparent = opacity !== undefined;
  const mat = <meshPhysicalMaterial color={c} metalness={m} roughness={r} emissive={e ?? '#000000'} emissiveIntensity={ei} clearcoat={clearcoat} clearcoatRoughness={.15} transparent={transparent} opacity={opacity ?? 1} />;
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

export function Wheel({ x, z, radius = .44, out = 1 }: { x: number; z: number; radius?: number; out?: number }) {
  return <group position={[x, radius, z]} rotation-x={Math.PI / 2}>
    <mesh castShadow><cylinderGeometry args={[radius, radius, .22, 32]} /><meshStandardMaterial color="#1c1a1b" roughness={.85} /></mesh>
    <mesh position={[0, .116 * out, 0]}><cylinderGeometry args={[radius * .66, radius * .66, .02, 32]} /><meshStandardMaterial color={palette.goldBright} metalness={.95} roughness={.18} /></mesh>
    {[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[0, .13 * out, 0]} rotation={[0, (i * Math.PI * 2) / 5, 0]}><boxGeometry args={[radius * 1.2, .012, radius * .12]} /><meshStandardMaterial color="#f1d9ae" metalness={1} roughness={.15} /></mesh>)}
    <mesh position={[0, .14 * out, 0]}><cylinderGeometry args={[radius * .14, radius * .14, .02, 20]} /><meshStandardMaterial color={palette.cream} metalness={.7} roughness={.2} /></mesh>
  </group>;
}

export function WheelArch({ x, z, radius = .5 }: { x: number; z: number; radius?: number }) {
  return <mesh position={[x, radius, z]} rotation-x={Math.PI / 2}><cylinderGeometry args={[radius, radius, .02, 32]} /><meshStandardMaterial color="#151213" roughness={.7} /></mesh>;
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
