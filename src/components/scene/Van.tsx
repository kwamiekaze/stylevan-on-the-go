import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { brand, palette, livery } from '@/config/brand';
import { createLiveryTexture } from './livery';
import { Ball, BarberChair, Bottles, Box, Cyl, GlowStrip, Mirror, Plant, PlushChair, TexPlane, Wheel, WheelArch, type V3 } from './parts';

/** Cargo box extents in van local space (meters). */
const X0 = -2.85, X1 = 1.45, Y0 = .45, Y1 = 2.9, Z = 1.1, T = .07;
/** Sliding door opening. */
const D0 = -1.05, D1 = .75, DY0 = .78, DY1 = 2.62;
const FLOOR = .62;
const TOTAL: [number, number, number, number] = [X0, X1, Y0, Y1];

const ivory = palette.ivory;

function Interior() {
  const zBack = -Z + T + .01;
  return <group>
    {/* floor, marble look with a gold inlay */}
    <Box p={[(X0 + X1) / 2, FLOOR - .02, 0]} s={[X1 - X0 - .1, .05, 2 * Z - .12]} c="#f3ece4" r={.18} m={.05} radius={0} cast={false} clearcoat={1} />
    <Box p={[(X0 + X1) / 2, FLOOR + .006, 0]} s={[X1 - X0 - .3, .006, .05]} c={palette.gold} m={.9} r={.2} radius={0} cast={false} />
    {/* interior wall lining */}
    <Box p={[(X0 + X1) / 2, 1.7, zBack + .02]} s={[X1 - X0 - .12, 2.1, .02]} c="#efd3cf" r={.8} radius={0} cast={false} />
    <Box p={[X0 + .1, 1.7, 0]} s={[.02, 2.1, 2 * Z - .2]} c="#efd3cf" r={.8} radius={0} cast={false} />
    {/* ceiling glow */}
    <GlowStrip p={[-.9, 2.8, -.5]} s={[3.4, .03, .06]} />
    <GlowStrip p={[-.9, 2.8, .5]} s={[3.4, .03, .06]} />
    <pointLight position={[-.5, 2.6, 0]} intensity={4.2} distance={5.5} color="#ffd9aa" />
    <pointLight position={[-2, 2.2, -.4]} intensity={2.2} distance={4} color="#ffcfa0" />

    {/* rear: shampoo station */}
    <Box p={[X0 + .5, .62 + .38, zBack + .28]} s={[.9, .76, .5]} c="#fff8f2" r={.4} radius={.03} clearcoat={.5} />
    <Box p={[X0 + .5, 1.03, zBack + .3]} s={[.5, .08, .42]} c="#ffffff" r={.15} radius={.05} clearcoat={1} />
    <Cyl p={[X0 + .5, 1.18, zBack + .12]} r={.02} h={.3} c={palette.goldBright} m={1} rough={.2} />
    <PlushChair p={[X0 + .5, FLOOR, zBack + .95]} rot={[0, Math.PI, 0]} h={.46} />
    <Plant p={[X0 + .85, .62 + .76, zBack + .28]} s={.8} />
    {/* -z wall: mirror, counter, barber chair */}
    <Box p={[-1.25, FLOOR + .45, zBack + .18]} s={[1.5, .9, .34]} c="#fdf6ef" r={.35} radius={.03} clearcoat={.6} />
    <Box p={[-1.25, FLOOR + .92, zBack + .18]} s={[1.56, .04, .38]} c="#ffffff" r={.12} radius={.01} clearcoat={1} />
    <Box p={[-1.25, FLOOR + .9, zBack + .38]} s={[1.5, .012, .02]} c={palette.gold} m={.9} r={.2} radius={0} />
    <Mirror p={[-1.25, 1.95, zBack + .035]} w={1.2} h={1.15} />
    <Bottles p={[-1.6, FLOOR + .94, zBack + .2]} n={7} span={.6} />
    <BarberChair p={[-1.25, FLOOR, zBack + .95]} rot={[0, Math.PI + .28, 0]} />
    {/* lash and brow bed along the wall */}
    <group position={[.15, FLOOR, zBack + .55]}>
      <Cyl p={[0, .15, 0]} r={.1} h={.3} c={palette.goldBright} m={1} rough={.2} />
      <Box p={[0, .38, 0]} s={[1.75, .16, .62]} c={palette.charcoal} r={.3} radius={.07} clearcoat={.6} />
      <Box p={[-.92, .5, 0]} s={[.3, .1, .4]} c={palette.charcoal} r={.3} radius={.05} rot={[0, 0, .25]} />
    </group>
    <mesh position={[.2, 1.4, zBack + .35]} rotation-x={Math.PI / 2}><torusGeometry args={[.2, .015, 8, 32]} /><meshStandardMaterial color="#fff" emissive="#fff1dc" emissiveIntensity={2.2} /></mesh>
    <Cyl p={[.2, 1.0, zBack + .35]} r={.012} h={.9} c={palette.goldBright} m={1} rough={.2} />
    {/* manicure station by the door */}
    <Cyl p={[.15, FLOOR + .36, .35]} r={.04} h={.72} c={palette.goldBright} m={1} rough={.2} />
    <Cyl p={[.15, FLOOR + .74, .35]} r={.42} h={.045} c="#ffffff" rough={.1} m={.1} />
    <Ball p={[.05, FLOOR + .84, .3]} r={.05} c="#e9bfc0" />
    <mesh position={[.28, FLOOR + .88, .38]}><cylinderGeometry args={[.035, .04, .1, 10]} /><meshStandardMaterial color="#ffb9c4" roughness={.3} /></mesh>
    <PlushChair p={[.15, FLOOR, -.02]} rot={[0, 0, 0]} />
    <PlushChair p={[.15, FLOOR, .72]} rot={[0, Math.PI, 0]} />
    {/* front nook */}
    <Box p={[X1 - .35, FLOOR + .45, .3]} s={[.5, .9, .55]} c="#f4e7dd" r={.35} radius={.03} />
    <Box p={[X1 - .34, FLOOR + .38, .58]} s={[.4, .6, .03]} c="#20292d" r={.1} m={.6} radius={.01} />
    <Box p={[X1 - .34, FLOOR + .38, .6]} s={[.36, .55, .01]} c="#8fd0ef" e="#6bc4f5" ei={.55} radius={0} cast={false} />
    <Plant p={[X1 - .35, FLOOR + .9, .18]} s={.8} />
    <Plant p={[1.15, FLOOR, -.75]} s={1.6} />
    <Plant p={[-2.55, FLOOR, .8]} s={1.5} />
  </group>;
}

export function Van({ open }: { open: boolean }) {
  const tex = useMemo(() => createLiveryTexture({ width: 2560, height: 1459, seed: 11, wordmarkY: livery.van.wordmarkY, taglineY: livery.van.taglineY, iconsY: livery.van.iconsY, wordmarkSize: livery.van.wordmarkSize, centerX: ((D0 + X0) / 2 - X0) / (X1 - X0), showPhone: true }), []);
  const door = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (door.current) door.current.rotation.y = THREE.MathUtils.damp(door.current.rotation.y, open ? 1.45 : 0, 3.6, Math.min(dt, .05)); });
  const shell: [string, V3, V3][] = [];
  const glassProps = { m: .5, r: .08 };
  void glassProps; void shell; void brand;
  return <group>
    {/* undercarriage skirt */}
    <Box p={[-.7, .38, 0]} s={[5.2, .22, 2.04]} c={palette.wine} r={.45} radius={.04} />
    {/* cargo shell */}
    <Box p={[(X0 + X1) / 2, .59, 0]} s={[X1 - X0, .09, 2 * Z]} c={ivory} radius={0} />
    <Box p={[(X0 + X1) / 2, Y1 - .035, 0]} s={[X1 - X0, .07, 2 * Z]} c={ivory} r={.3} radius={.03} clearcoat={1} />
    <Box p={[X0 + T / 2, (Y0 + Y1) / 2 + .1, 0]} s={[T, Y1 - Y0 - .2, 2 * Z]} c={ivory} radius={0} />
    <Box p={[X1 - T / 2, (Y0 + Y1) / 2 + .1, 0]} s={[T, Y1 - Y0 - .2, 2 * Z]} c={ivory} radius={0} />
    <Box p={[(X0 + X1) / 2, (Y0 + Y1) / 2 + .1, -Z + T / 2]} s={[X1 - X0, Y1 - Y0 - .2, T]} c={ivory} radius={0} />
    <TexPlane map={tex} total={TOTAL} seg={[X0, X1, Y0 + .1, Y1]} z={-Z - .003} flip />
    {/* +z wall pieces around the sliding door opening */}
    <Box p={[(X0 + D0) / 2, (Y0 + Y1) / 2 + .1, Z - T / 2]} s={[D0 - X0, Y1 - Y0 - .2, T]} c={ivory} radius={0} />
    <Box p={[(D1 + X1) / 2, (Y0 + Y1) / 2 + .1, Z - T / 2]} s={[X1 - D1, Y1 - Y0 - .2, T]} c={ivory} radius={0} />
    <Box p={[(D0 + D1) / 2, (DY1 + Y1) / 2, Z - T / 2]} s={[D1 - D0, Y1 - DY1, T]} c={ivory} radius={0} />
    <Box p={[(D0 + D1) / 2, (Y0 + DY0) / 2 + .08, Z - T / 2]} s={[D1 - D0, DY0 - Y0 - .16, T]} c={ivory} radius={0} />
    <TexPlane map={tex} total={TOTAL} seg={[X0, D0, Y0 + .1, Y1]} z={Z + .002} />
    <TexPlane map={tex} total={TOTAL} seg={[D1, X1, Y0 + .1, Y1]} z={Z + .002} />
    <TexPlane map={tex} total={TOTAL} seg={[D0, D1, DY1, Y1]} z={Z + .002} />
    <TexPlane map={tex} total={TOTAL} seg={[D0, D1, Y0 + .1, DY0]} z={Z + .002} />
    {/* door frame trim */}
    <Box p={[(D0 + D1) / 2, DY1 + .01, Z + .012]} s={[D1 - D0 + .06, .04, .03]} c={palette.goldBright} m={.9} r={.2} radius={.006} />
    <Box p={[(D0 + D1) / 2, DY0 - .01, Z + .012]} s={[D1 - D0 + .06, .04, .03]} c={palette.goldBright} m={.9} r={.2} radius={.006} />
    {/* sliding door */}
    <group ref={door} position={[D1, 0, Z]}>
      <group position={[-D1, 0, -Z + .06]}>
        <TexPlane map={tex} total={TOTAL} seg={[D0, D1, DY0, DY1]} z={Z + .028} />
        <Box p={[(D0 + D1) / 2, (DY0 + DY1) / 2, Z + .01]} s={[D1 - D0 - .02, DY1 - DY0 - .02, .05]} c={ivory} r={.3} radius={.02} />
        <Box p={[(D0 + D1) / 2, 2.3, Z + .045]} s={[D1 - D0 - .3, .5, .01]} c="#5f7684" m={.35} r={.05} radius={.01} />
        <Box p={[D0 + .12, 1.65, Z + .05]} s={[.05, .3, .04]} c={palette.goldBright} m={1} r={.2} radius={.01} />
      </group>
    </group>
    <Interior />
    {/* rear detail */}
    <Box p={[X0 - .03, .9, 0]} s={[.06, .2, 1.9]} c={palette.goldBright} m={.85} r={.2} radius={.02} />
    {[-.85, .85].map(z => <Box key={z} p={[X0 - .02, 1.2, z]} s={[.04, .32, .16]} c="#c72f45" e="#ff3b57" ei={.8} radius={.02} />)}
    {/* cab */}
    <Box p={[1.92, 1.02, 0]} s={[.95, 1.1, 2.18]} c={ivory} r={.28} clearcoat={1} radius={.06} />
    <Box p={[1.92, 2.86, 0]} s={[.95, .08, 2.15]} c={ivory} r={.3} radius={.03} />
    <Box p={[2.68, 1.0, 0]} s={[.7, .98, 2.14]} c={ivory} r={.28} clearcoat={1} radius={.08} rot={[0, 0, -.03]} />
    <mesh position={[2.6, 2.18, 0]} rotation-z={.355} castShadow><boxGeometry args={[.05, 1.44, 1.92]} /><meshPhysicalMaterial color="#5f7684" metalness={.35} roughness={.04} clearcoat={1} /></mesh>
    {[-1, 1].map(s => <group key={s} position={[0, 0, s * 1.06]}>
      <mesh position={[1.95, 2.18, 0]} rotation-y={s > 0 ? 0 : Math.PI}><shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(-.4, -.56); sh.lineTo(.86, -.56); sh.lineTo(.42, .62); sh.lineTo(-.4, .62); sh.closePath(); return sh; })()]} /><meshPhysicalMaterial color="#5f7684" metalness={.35} roughness={.04} clearcoat={1} side={THREE.DoubleSide} /></mesh>
      <Box p={[1.95, 1.62, s * .002]} s={[1.05, .04, .04]} c={palette.goldBright} m={.9} r={.2} radius={.01} />
      <Box p={[1.62, 1.35, s * .12]} s={[.36, .2, .3]} c="#2a2426" m={.3} r={.3} radius={.05} />
    </group>)}
    <Box p={[2.995, 1.12, 0]} s={[.05, .5, 1.5]} c="#1d1a1c" m={.5} r={.3} radius={.02} />
    {[-.7, .7].map(z => <Box key={z} p={[3.02, 1.05, z]} s={[.05, .16, .34]} c="#fff8e6" e="#ffe2a8" ei={2.4} radius={.05} />)}
    <Box p={[3.0, .68, 0]} s={[.2, .32, 2.1]} c={palette.goldBright} m={.9} r={.22} radius={.06} />
    <Box p={[3.03, .46, 0]} s={[.08, .12, 1.4]} c="#1d1a1c" r={.5} radius={.03} />
    {/* roof AC and vents */}
    <Box p={[-1.4, 3.02, 0]} s={[1.1, .2, .85]} c={ivory} r={.35} radius={.08} />
    <Box p={[-1.4, 3.13, 0]} s={[.7, .04, .5]} c="#2a2426" r={.5} radius={.02} />
    <Box p={[.4, 2.96, 0]} s={[.5, .09, .4]} c={ivory} r={.35} radius={.04} />
    <Box p={[(X0 + X1) / 2, 2.905, Z - .03]} s={[X1 - X0, .02, .02]} c={palette.goldBright} m={.9} r={.2} radius={0} e="#ffd9a1" ei={.5} />
    {/* wheels */}
    {[-1.65, 1.95].map(x => [-1.02, 1.02].map(z => <group key={`${x}${z}`}><WheelArch x={x} z={z > 0 ? z + .09 : z - .09} /><Wheel x={x} z={z} radius={.44} out={z > 0 ? 1 : -1} /></group>))}
    {/* underglow */}
    <pointLight position={[-.3, .18, 0]} intensity={1.6} distance={4.5} color="#ffb98a" />
  </group>;
}
