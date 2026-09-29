import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { palette, livery } from '@/config/brand';
import { createSignTexture, getLivery, marbleTexture } from './livery';
import { Ball, Box, Bottles, Cyl, Dress, GlowStrip, MirrorReal, Plant, PlushChair, Sofa, TexPlane, Towels, Vase, Wheel, WheelArch, type V3 } from './parts';

/** Trailer box extents in local space (meters). */
const X0 = -2.95, X1 = 2.95, Y0 = .38, Y1 = 3.1, Z = 1.215, T = .07;
const D0 = -1.55, D1 = 1.55, DY0 = .92, DY1 = 2.9;
const FLOOR = .7;
const TOTAL: [number, number, number, number] = [X0, X1, Y0, Y1];
const ivory = palette.ivory;
const LINING = '#efd3cf';
const gold = palette.goldBright;

function Chandelier({ p }: { p: V3 }) {
  const arms = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({ a: (i / 8) * Math.PI * 2 })), []);
  return <group position={p}>
    <Cyl p={[0, .35, 0]} r={.012} h={.7} c={gold} m={1} rough={.2} />
    <Cyl p={[0, 0, 0]} r={.06} h={.12} c={gold} m={1} rough={.2} />
    {arms.map((q, i) => <group key={i} rotation-y={q.a}>
      <mesh position={[.2, -.02, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[.008, .008, .4, 6]} /><meshStandardMaterial color={gold} metalness={1} roughness={.2} /></mesh>
      <mesh position={[.4, .04, 0]}><sphereGeometry args={[.035, 10, 8]} /><meshStandardMaterial color="#fff" emissive="#ffe0b0" emissiveIntensity={3.2} /></mesh>
      <mesh position={[.4, -.08, 0]}><icosahedronGeometry args={[.03, 0]} /><meshPhysicalMaterial color="#ffffff" transmission={0} roughness={0} metalness={.2} clearcoat={1} envMapIntensity={2} /></mesh>
    </group>)}
    <mesh position={[0, -.12, 0]}><icosahedronGeometry args={[.07, 1]} /><meshPhysicalMaterial color="#fff" roughness={0} metalness={.3} clearcoat={1} envMapIntensity={2} /></mesh>
  </group>;
}

function Interior({ sign, mobile }: { sign: THREE.Texture; mobile: boolean }) {
  const zb = -Z + T + .01;
  const floorTex = useMemo(() => { const t = marbleTexture().clone(); t.repeat.set(4, 1.6); t.needsUpdate = true; return t; }, []);
  const lin = { c: LINING, r: .75, radius: 0 as const, cast: false };
  const midY = (FLOOR + 3.0) / 2;
  return <group>
    <mesh position={[0, FLOOR - .03, 0]} receiveShadow><boxGeometry args={[X1 - X0 - .1, .05, 2 * Z - .1]} /><meshPhysicalMaterial map={floorTex} roughness={.12} clearcoat={1} clearcoatRoughness={.05} envMapIntensity={1.3} /></mesh>
    <Box p={[0, FLOOR, 0]} s={[X1 - X0 - .3, .006, .04]} c={palette.gold} m={.9} r={.2} radius={0} cast={false} />
    {/* lining on every wall, facing inward */}
    <Box p={[0, midY, zb + .02]} s={[X1 - X0 - .12, 2.3, .02]} {...lin} />
    <Box p={[(X0 + D0 + .07) / 2, midY, Z - T - .02]} s={[D0 - X0 - .07, 2.3, .02]} {...lin} />
    <Box p={[(D1 + X1 - .07) / 2, midY, Z - T - .02]} s={[X1 - D1 - .07, 2.3, .02]} {...lin} />
    <Box p={[0, (DY1 + 3.0) / 2, Z - T - .02]} s={[D1 - D0, 3.0 - DY1, .02]} {...lin} />
    <Box p={[0, (FLOOR + DY0) / 2, Z - T - .02]} s={[D1 - D0, DY0 - FLOOR, .02]} {...lin} />
    <Box p={[X0 + T + .02, midY, 0]} s={[.02, 2.3, 2 * Z - .2]} {...lin} />
    <Box p={[X1 - T - .02, midY, 0]} s={[.02, 2.3, 2 * Z - .2]} {...lin} />
    <Box p={[0, 3.0, 0]} s={[X1 - X0 - .14, .02, 2 * Z - .16]} c="#fbf3ea" r={.6} radius={0} cast={false} />
    {[FLOOR + 1.2, 2.72].map(y => <Box key={y} p={[0, y, zb + .035]} s={[X1 - X0 - .14, .014, .012]} c={gold} m={.9} r={.2} radius={0} cast={false} />)}
    <GlowStrip p={[0, 2.98, -.55]} s={[5.4, .012, .05]} />
    <GlowStrip p={[0, 2.98, .55]} s={[5.4, .012, .05]} />
    <Chandelier p={[-.4, 2.6, .1]} />
    <pointLight position={[-.4, 2.5, .1]} intensity={5.2} distance={6.5} color="#ffd6a0" />
    <pointLight position={[-1.9, 2.3, -.3]} intensity={2.2} distance={4.5} color="#ffc98f" />
    {/* vanity with Hollywood mirrors on the back wall */}
    <Box p={[.5, FLOOR + .44, zb + .22]} s={[2.9, .88, .4]} c="#fffaf5" r={.3} radius={.03} clearcoat={.6} />
    <Box p={[.5, FLOOR + .9, zb + .22]} s={[2.96, .04, .44]} c="#fff" r={.08} radius={.01} clearcoat={1} />
    <Box p={[.5, FLOOR + .92, zb + .45]} s={[2.9, .012, .02]} c={palette.gold} m={.9} r={.2} radius={0} />
    {[.1, .3].flatMap(z => [-.4, .5, 1.4].map(x => <Box key={`${x}${z}`} p={[x, FLOOR + .5, zb + .43]} s={[.012, .3, .02]} c={gold} m={1} r={.2} radius={0} cast={false} />)).slice(0, 3)}
    <MirrorReal p={[-.45, 2.05, zb + .06]} w={.8} h={1.1} near={5.5} />
    <MirrorReal p={[.5, 2.05, zb + .06]} w={.8} h={1.1} near={5.5} />
    <MirrorReal p={[1.45, 2.05, zb + .06]} w={.8} h={1.1} near={5.5} />
    <mesh position={[.5, 2.86, zb + .04]}><planeGeometry args={[2.6, .5]} /><meshBasicMaterial map={sign} transparent toneMapped={false} /></mesh>
    <Bottles p={[-.7, FLOOR + .92, zb + .2]} n={6} span={.5} />
    <Bottles p={[1.15, FLOOR + .92, zb + .2]} n={7} span={.6} />
    <Vase p={[.55, FLOOR + .92, zb + .22]} s={.9} />
    <PlushChair p={[-.45, FLOOR, zb + 1.0]} rot={[0, Math.PI - .12, 0]} h={.5} />
    <PlushChair p={[.85, FLOOR, zb + 1.0]} rot={[0, Math.PI + .12, 0]} h={.5} />
    {/* gown rail */}
    <Cyl p={[-1.35, 2.38, zb + .55]} r={.012} h={.95} c={gold} m={1} rough={.2} rot={[0, 0, Math.PI / 2]} />
    <Cyl p={[-1.86, 1.55, zb + .55]} r={.012} h={1.7} c={gold} m={1} rough={.2} />
    <Cyl p={[-.84, 1.55, zb + .55]} r={.012} h={1.7} c={gold} m={1} rough={.2} />
    {[-1.68, -1.53, -1.38, -1.23, -1.08].map((x, i) => <Dress key={x} p={[x, 2.35, zb + .55]} tint={i % 2 ? '#fdf9f3' : '#f6ecdf'} />)}
    {/* lounge */}
    <mesh position={[-1.55, FLOOR + .01, .3]} rotation-x={-Math.PI / 2}><circleGeometry args={[.95, 40]} /><meshStandardMaterial color="#f3dcdd" roughness={1} /></mesh>
    <mesh position={[-1.55, FLOOR + .012, .3]} rotation-x={-Math.PI / 2}><ringGeometry args={[.82, .86, 40]} /><meshStandardMaterial color={palette.gold} metalness={1} roughness={.3} /></mesh>
    <Sofa p={[-2.2, FLOOR, .25]} rot={[0, Math.PI / 2, 0]} w={1.6} />
    <Cyl p={[-1.3, FLOOR + .24, .3]} r={.32} h={.04} c="#f6f0ea" rough={.06} />
    <Cyl p={[-1.3, FLOOR + .12, .3]} r={.05} h={.24} c={gold} m={1} rough={.2} />
    <Vase p={[-1.3, FLOOR + .26, .3]} s={1.1} />
    <Cyl p={[-1.15, FLOOR + .3, .42]} r={.03} h={.08} c="#fff" rough={.1} />
    <Plant p={[1.25, FLOOR, .75]} s={1.7} />
    <Plant p={[-2.5, FLOOR, -.9]} s={1.3} />
    {/* storage wall */}
    <Box p={[2.62, FLOOR + .95, -.2]} s={[.4, 1.9, 1.5]} c="#fffaf5" r={.35} radius={.02} />
    {[.35, .8, 1.25, 1.7].map(y => <group key={y}><Bottles p={[2.4, FLOOR + y, -.45]} n={5} span={.6} /><Bottles p={[2.4, FLOOR + y, .1]} n={5} span={.6} /></group>)}
    {[.3, .75, 1.2, 1.65].map(y => <Box key={y} p={[2.42, FLOOR + y - .02, -.2]} s={[.02, .012, 1.4]} c={gold} m={.9} r={.2} radius={0} cast={false} />)}
    <Towels p={[2.4, FLOOR + .05, .5]} n={4} />
    {mobile ? null : <Towels p={[2.4, FLOOR + .95, .5]} n={3} />}
  </group>;
}

export function Trailer({ open, ghost = false }: { open: boolean; ghost?: boolean }) {
  const mobile = useThree(s => s.size.width < 900);
  const tex = useMemo(() => getLivery(mobile ? 'trailer-s' : 'trailer', { width: mobile ? 1600 : 2560, height: mobile ? 731 : 1170, seed: 29, wordmarkY: livery.trailer.wordmarkY, taglineY: livery.trailer.taglineY, iconsY: livery.trailer.iconsY, wordmarkSize: livery.trailer.wordmarkSize, centerX: .5, showPhone: true }), [mobile]);
  const sign = useMemo(() => createSignTexture(), []);
  const awning = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (awning.current) awning.current.rotation.x = THREE.MathUtils.damp(awning.current.rotation.x, open ? -1.2 : 0, 3, Math.min(dt, .05)); });
  const h = DY1 - DY0;
  const paintProps = { c: ivory, r: .24, clearcoat: 1 } as const;
  return <group>
    <Box p={[0, .5, 0]} s={[5.98, .3, 2.44]} c={palette.wine} r={.4} radius={.05} />
    <Box p={[0, .66, 0]} s={[5.7, .04, 2.5]} c={gold} m={.9} r={.2} radius={0} cast={false} />
    <Box p={[0, FLOOR - .1, 0]} s={[X1 - X0, .09, 2 * Z]} c={ivory} radius={0} />
    <Box p={[0, Y1 - .035, 0]} s={[X1 - X0 + .04, .08, 2 * Z + .04]} {...paintProps} radius={.04} />
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
    {/* corner posts, trim and door frame */}
    {[-1, 1].flatMap(sx => [-1, 1].map(sz => <Box key={`${sx}${sz}`} p={[sx * (X1 - .02), (Y0 + Y1) / 2, sz * (Z - .02)]} s={[.1, Y1 - Y0, .1]} {...paintProps} radius={.04} />))}
    {[-1, 1].map(s => <Box key={s} p={[0, 1.62, s * (Z + .012)]} s={[X1 - X0, .012, .012]} c={gold} m={.95} r={.18} radius={0} cast={false} />)}
    <Box p={[0, DY1 + .01, Z + .02]} s={[D1 - D0 + .08, .05, .04]} c={gold} m={.9} r={.2} radius={.008} />
    <Box p={[0, DY0 - .01, Z + .02]} s={[D1 - D0 + .08, .05, .04]} c={gold} m={.9} r={.2} radius={.008} />
    {/* awning door, hinged at the top */}
    <group ref={awning} position={[0, DY1, Z + .03]}>
      <group position={[0, -h / 2, 0]}>
        <TexPlane map={tex} total={TOTAL} seg={[D0, D1, DY0, DY1]} z={.032} />
        <Box p={[0, 0, 0]} s={[D1 - D0 - .02, h, .05]} {...paintProps} radius={.02} />
        <Box p={[0, 0, -.03]} s={[D1 - D0 - .1, h - .1, .012]} c={palette.blush} r={.5} radius={.01} />
        <Box p={[0, -h / 2 + .03, .04]} s={[D1 - D0, .05, .05]} c={gold} m={.9} r={.2} radius={.01} />
      </group>
    </group>
    {open && [-1.4, 1.4].map(x => <mesh key={x} position={[x, 1.75, Z + .95]} rotation-x={.5}><cylinderGeometry args={[.018, .018, 1.95, 8]} /><meshStandardMaterial color={gold} metalness={1} roughness={.2} /></mesh>)}
    {!ghost && <Interior sign={sign} mobile={mobile} />}
    {/* entry step */}
    <Box p={[0, .55, Z + .3]} s={[1.3, .1, .55]} c={palette.gold} m={.7} r={.25} radius={.03} />
    <Box p={[0, .3, Z + .42]} s={[1.3, .1, .4]} c={palette.wine} r={.4} radius={.03} />
    <GlowStrip p={[0, .61, Z + .55]} s={[1.25, .014, .02]} />
    {/* rear lights, roof AC */}
    {[-1, 1].map(z => <group key={z}><Box p={[X0 - .03, 1.0, z * 1.05]} s={[.06, .44, .16]} c="#1d1a1c" r={.3} radius={.03} /><Box p={[X0 - .065, 1.0, z * 1.05]} s={[.02, .36, .1]} c="#c72f45" e="#ff3b57" ei={1.4} radius={.012} cast={false} /></group>)}
    <Box p={[1.3, 3.28, 0]} s={[1.1, .26, .9]} {...paintProps} radius={.09} />
    {[-.24, -.12, 0, .12, .24].map(z => <Box key={z} p={[1.3, 3.415, z]} s={[.8, .012, .05]} c="#2a2426" radius={0} cast={false} />)}
    <Box p={[0, Y1 - .02, Z - .05]} s={[X1 - X0, .025, .025]} c={gold} m={.9} r={.2} radius={0} e="#ffd9a1" ei={.6} cast={false} />
    {/* wheels and fenders */}
    {[-1.05, .15].map(x => [-1, 1].map(s => <group key={`${x}${s}`}><WheelArch x={x} z={s * (Z + .008)} radius={.54} /><Wheel x={x} z={s * 1.14} radius={.44} out={s} /></group>))}
    {[-1, 1].map(s => <Box key={s} p={[-.45, .95, s * 1.37]} s={[1.85, .06, .3]} c={ivory} r={.24} radius={.03} clearcoat={1} />)}
    {/* hitch tongue */}
    <Box p={[3.85, .62, 0]} s={[1.8, .09, .16]} c="#2a2426" m={.4} r={.4} radius={.02} />
    <Box p={[3.4, .62, .32]} s={[1.0, .07, .09]} c="#2a2426" m={.4} r={.4} radius={.02} rot={[0, .32, 0]} />
    <Box p={[3.4, .62, -.32]} s={[1.0, .07, .09]} c="#2a2426" m={.4} r={.4} radius={.02} rot={[0, -.32, 0]} />
    <Cyl p={[3.1, .32, 0]} r={.035} h={.5} c="#2a2426" m={.4} />
    {!ghost && <pointLight position={[0, .18, 0]} intensity={1.8} distance={5} color="#ffb98a" />}
  </group>;
}
