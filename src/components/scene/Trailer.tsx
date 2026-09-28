import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { palette, livery } from '@/config/brand';
import { createLiveryTexture, createSignTexture } from './livery';
import { Box, Bottles, Cyl, Dress, GlowStrip, Mirror, Plant, PlushChair, Sofa, TexPlane, Wheel, WheelArch, Ball } from './parts';

/** Trailer box extents in local space (meters). */
const X0 = -2.95, X1 = 2.95, Y0 = .38, Y1 = 3.1, Z = 1.215, T = .07;
const D0 = -1.55, D1 = 1.55, DY0 = .92, DY1 = 2.9;
const FLOOR = .7;
const TOTAL: [number, number, number, number] = [X0, X1, Y0, Y1];
const ivory = palette.ivory;

function Interior({ sign }: { sign: THREE.Texture }) {
  const zb = -Z + T + .01;
  return <group>
    <Box p={[0, FLOOR - .03, 0]} s={[X1 - X0 - .1, .05, 2 * Z - .1]} c="#f3ece4" r={.18} m={.05} radius={0} cast={false} clearcoat={1} />
    <Box p={[0, 1.9, zb + .02]} s={[X1 - X0 - .1, 2.4, .02]} c="#efd3cf" r={.8} radius={0} cast={false} />
    <Box p={[X0 + .08, 1.9, 0]} s={[.02, 2.4, 2 * Z - .2]} c="#efd3cf" r={.8} radius={0} cast={false} />
    <GlowStrip p={[0, 3.02, -.6]} s={[5.4, .03, .06]} />
    <GlowStrip p={[0, 3.02, .5]} s={[5.4, .03, .06]} />
    <pointLight position={[0, 2.8, .2]} intensity={5.2} distance={6.5} color="#ffd6a0" />
    <pointLight position={[-1.6, 2.3, -.3]} intensity={2.4} distance={4.5} color="#ffc98f" />
    {/* back wall: vanity, mirrors, sign */}
    <Box p={[.5, FLOOR + .44, zb + .22]} s={[2.9, .88, .4]} c="#fdf6ef" r={.35} radius={.03} clearcoat={.6} />
    <Box p={[.5, FLOOR + .9, zb + .22]} s={[2.96, .04, .44]} c="#ffffff" r={.12} radius={.01} clearcoat={1} />
    <Box p={[.5, FLOOR + .9, zb + .45]} s={[2.9, .012, .02]} c={palette.gold} m={.9} r={.2} radius={0} />
    {[-.45, .5, 1.45].map(x => <Mirror key={x} p={[x, 1.98, zb + .035]} w={.8} h={1.05} />)}
    <mesh position={[.5, 2.72, zb + .04]}><planeGeometry args={[2.6, .62]} /><meshBasicMaterial map={sign} transparent toneMapped={false} /></mesh>
    <Bottles p={[-.7, FLOOR + .92, zb + .2]} n={6} span={.5} />
    <Bottles p={[1.15, FLOOR + .92, zb + .2]} n={7} span={.6} />
    <PlushChair p={[-.45, FLOOR, zb + 1.0]} rot={[0, Math.PI - .12, 0]} h={.5} />
    <PlushChair p={[.85, FLOOR, zb + 1.0]} rot={[0, Math.PI + .12, 0]} h={.5} />
    {/* garment rail with gowns */}
    <Cyl p={[-1.35, 2.35, zb + .55]} r={.012} h={.9} c={palette.goldBright} m={1} rough={.2} rot={[0, 0, Math.PI / 2]} />
    <Cyl p={[-1.78, 1.5, zb + .55]} r={.012} h={1.7} c={palette.goldBright} m={1} rough={.2} />
    {[-1.65, -1.5, -1.35, -1.2, -1.05].map((x, i) => <Dress key={x} p={[x, 2.32, zb + .55]} tint={i % 2 ? '#fdf9f3' : '#f6ecdf'} />)}
    {/* lounge */}
    <Sofa p={[-1.9, FLOOR, .25]} rot={[0, Math.PI / 2, 0]} w={1.5} />
    <Cyl p={[-.85, FLOOR + .25, .55]} r={.3} h={.04} c={palette.goldBright} m={1} rough={.2} />
    <Cyl p={[-.85, FLOOR + .13, .55]} r={.04} h={.26} c={palette.goldBright} m={1} rough={.2} />
    <Ball p={[-.85, FLOOR + .38, .55]} r={.11} c="#f4b8c1" sy={.9} />
    <Ball p={[-.79, FLOOR + .36, .6]} r={.08} c="#fff" sy={.9} />
    <Plant p={[1.25, FLOOR, .55]} s={1.7} />
    <Plant p={[-1.2, FLOOR, -.9]} s={1.2} />
    {/* right: storage wall of towels and products */}
    <Box p={[2.5, FLOOR + .9, -.2]} s={[.5, 1.8, 1.4]} c="#fdf6ef" r={.4} radius={.02} />
    {[.4, .85, 1.3, 1.7].map(y => <Bottles key={y} p={[2.27, FLOOR + y, -.2]} n={6} span={1.1} />)}
  </group>;
}

export function Trailer({ open }: { open: boolean }) {
  const tex = useMemo(() => createLiveryTexture({ width: 2560, height: 1170, seed: 29, wordmarkY: livery.trailer.wordmarkY, taglineY: livery.trailer.taglineY, iconsY: livery.trailer.iconsY, wordmarkSize: livery.trailer.wordmarkSize, centerX: .5, showPhone: true }), []);
  const sign = useMemo(() => createSignTexture(), []);
  const awning = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (awning.current) awning.current.rotation.x = THREE.MathUtils.damp(awning.current.rotation.x, open ? -1.2 : 0, 3, Math.min(dt, .05)); });
  const h = DY1 - DY0;
  return <group>
    <Box p={[0, .5, 0]} s={[5.98, .3, 2.44]} c={palette.wine} r={.45} radius={.05} />
    <Box p={[0, FLOOR - .1, 0]} s={[X1 - X0, .09, 2 * Z]} c={ivory} radius={0} />
    <Box p={[0, Y1 - .035, 0]} s={[X1 - X0 + .04, .08, 2 * Z + .04]} c={ivory} r={.3} radius={.03} clearcoat={1} />
    <Box p={[X0 + T / 2, (Y0 + Y1) / 2 + .1, 0]} s={[T, Y1 - Y0 - .2, 2 * Z]} c={ivory} radius={0} />
    <Box p={[X1 - T / 2, (Y0 + Y1) / 2 + .1, 0]} s={[T, Y1 - Y0 - .2, 2 * Z]} c={ivory} radius={0} />
    <Box p={[0, (Y0 + Y1) / 2 + .1, -Z + T / 2]} s={[X1 - X0, Y1 - Y0 - .2, T]} c={ivory} radius={0} />
    <TexPlane map={tex} total={TOTAL} seg={[X0, X1, Y0 + .1, Y1]} z={-Z - .003} flip />
    <Box p={[(X0 + D0) / 2, (Y0 + Y1) / 2 + .1, Z - T / 2]} s={[D0 - X0, Y1 - Y0 - .2, T]} c={ivory} radius={0} />
    <Box p={[(D1 + X1) / 2, (Y0 + Y1) / 2 + .1, Z - T / 2]} s={[X1 - D1, Y1 - Y0 - .2, T]} c={ivory} radius={0} />
    <Box p={[0, (DY1 + Y1) / 2, Z - T / 2]} s={[D1 - D0, Y1 - DY1, T]} c={ivory} radius={0} />
    <Box p={[0, (Y0 + DY0) / 2 + .08, Z - T / 2]} s={[D1 - D0, DY0 - Y0 - .16, T]} c={ivory} radius={0} />
    <TexPlane map={tex} total={TOTAL} seg={[X0, D0, Y0 + .1, Y1]} z={Z + .002} />
    <TexPlane map={tex} total={TOTAL} seg={[D1, X1, Y0 + .1, Y1]} z={Z + .002} />
    <TexPlane map={tex} total={TOTAL} seg={[D0, D1, DY1, Y1]} z={Z + .002} />
    <TexPlane map={tex} total={TOTAL} seg={[D0, D1, Y0 + .1, DY0]} z={Z + .002} />
    <Box p={[0, DY1 + .01, Z + .02]} s={[D1 - D0 + .08, .05, .04]} c={palette.goldBright} m={.9} r={.2} radius={.008} />
    {/* awning door, hinged at the top */}
    <group ref={awning} position={[0, DY1, Z + .03]}>
      <group position={[0, -h / 2, 0]}>
        <TexPlane map={tex} total={TOTAL} seg={[D0, D1, DY0, DY1]} z={.032} />
        <Box p={[0, 0, 0]} s={[D1 - D0 - .02, h, .05]} c={ivory} r={.3} radius={.02} />
        <Box p={[0, 0, -.03]} s={[D1 - D0 - .1, h - .1, .012]} c={palette.blush} r={.5} radius={.01} />
        <Box p={[0, -h / 2 + .03, .04]} s={[D1 - D0, .05, .05]} c={palette.goldBright} m={.9} r={.2} radius={.01} />
      </group>
      {/* awning string lights */}
    </group>
    {open && [-1.4, 1.4].map(x => <mesh key={x} position={[x, 1.75, Z + .95]} rotation-x={.5}><cylinderGeometry args={[.018, .018, 1.95, 8]} /><meshStandardMaterial color={palette.goldBright} metalness={1} roughness={.2} /></mesh>)}
    <Interior sign={sign} />
    {/* entry step */}
    <Box p={[0, .55, Z + .3]} s={[1.3, .1, .55]} c={palette.gold} m={.7} r={.25} radius={.03} />
    <Box p={[0, .3, Z + .42]} s={[1.3, .1, .4]} c={palette.wine} r={.4} radius={.03} />
    <GlowStrip p={[0, .61, Z + .55]} s={[1.25, .014, .02]} />
    {/* rear lights and roof AC */}
    {[-1, 1].map(z => <Box key={z} p={[X0 - .02, 1.0, z * 1.05]} s={[.04, .4, .14]} c="#c72f45" e="#ff3b57" ei={.8} radius={.02} />)}
    <Box p={[1.3, 3.28, 0]} s={[1.1, .26, .9]} c={ivory} r={.35} radius={.08} />
    <Box p={[1.3, 3.42, 0]} s={[.7, .04, .5]} c="#2a2426" r={.5} radius={.02} />
    <Box p={[0, Y1 - .02, Z - .05]} s={[X1 - X0, .025, .025]} c={palette.goldBright} m={.9} r={.2} radius={0} e="#ffd9a1" ei={.6} />
    {/* wheels, fenders */}
    {[-1.05, .15].map(x => [-1.2, 1.2].map(z => <group key={`${x}${z}`}><WheelArch x={x} z={z > 0 ? z + .1 : z - .1} radius={.54} /><Wheel x={x} z={z} radius={.44} out={z > 0 ? 1 : -1} /></group>))}
    <Box p={[-.45, .88, 1.36]} s={[1.75, .07, .3]} c={ivory} r={.3} radius={.03} />
    <Box p={[-.45, .88, -1.36]} s={[1.75, .07, .3]} c={ivory} r={.3} radius={.03} />
    {/* hitch tongue */}
    <Box p={[3.85, .62, 0]} s={[1.8, .09, .16]} c="#2a2426" m={.4} r={.4} radius={.02} />
    <Box p={[3.4, .62, .32]} s={[1.0, .07, .09]} c="#2a2426" m={.4} r={.4} radius={.02} rot={[0, .32, 0]} />
    <Box p={[3.4, .62, -.32]} s={[1.0, .07, .09]} c="#2a2426" m={.4} r={.4} radius={.02} rot={[0, -.32, 0]} />
    <Cyl p={[3.1, .32, 0]} r={.035} h={.5} c="#2a2426" m={.4} />
    <pointLight position={[0, .18, 0]} intensity={1.8} distance={5} color="#ffb98a" />
  </group>;
}
