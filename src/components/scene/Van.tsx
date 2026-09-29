import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { palette, livery } from '@/config/brand';
import { getLivery, marbleTexture, plateTexture } from './livery';
import { Ball, BarberChair, Bottles, Box, Cyl, GlowStrip, MirrorReal, Plant, PlushChair, PolishRack, Quad, RingLight, ShampooBowl, TexPlane, Vase, Wheel, WheelArch, type V3 } from './parts';

/** Cargo box extents in van local space (meters). */
const X0 = -2.85, X1 = 1.45, Y0 = .45, Y1 = 2.9, Z = 1.1, T = .07;
const D0 = -1.05, D1 = .75, DY0 = .78, DY1 = 2.62;
const FLOOR = .62;
const TOTAL: [number, number, number, number] = [X0, X1, Y0, Y1];
const ivory = palette.ivory;
const LINING = '#efd3cf';
const gold = palette.goldBright;

const paint = new THREE.MeshPhysicalMaterial({ color: ivory, roughness: .24, metalness: .05, clearcoat: 1, clearcoatRoughness: .07, envMapIntensity: 1.25 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: '#0e1a22', roughness: .03, metalness: .85, clearcoat: 1, envMapIntensity: 1.8 });
const chrome = new THREE.MeshStandardMaterial({ color: '#dcdcdc', metalness: 1, roughness: .12 });
const rubber = new THREE.MeshStandardMaterial({ color: '#141213', roughness: .8 });

function cabGeometry() {
  const s = new THREE.Shape();
  s.moveTo(1.45, .5); s.lineTo(2.95, .5); s.quadraticCurveTo(3.04, .52, 3.05, .66); s.lineTo(3.05, 1.06);
  s.quadraticCurveTo(3.05, 1.28, 2.88, 1.36); s.lineTo(2.56, 1.45); s.lineTo(2.12, 2.5);
  s.quadraticCurveTo(2.06, 2.66, 1.9, 2.7); s.lineTo(1.45, 2.86); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.94, bevelEnabled: true, bevelThickness: .08, bevelSize: .06, bevelSegments: 5, curveSegments: 18 });
  g.translate(0, 0, -.97);
  return g;
}

function Interior({ mobile }: { mobile: boolean }) {
  const floorTex = useMemo(() => { const t = marbleTexture().clone(); t.repeat.set(3, 1.6); t.needsUpdate = true; return t; }, []);
  const zb = -Z + T + .01;
  const lin = { c: LINING, r: .75, radius: 0 as const, cast: false };
  return <group>
    {/* floor and lining, all facing inward so they read from inside the van */}
    <mesh position={[(X0 + X1) / 2, FLOOR - .015, 0]} receiveShadow><boxGeometry args={[X1 - X0 - .1, .05, 2 * Z - .12]} /><meshPhysicalMaterial map={floorTex} roughness={.12} clearcoat={1} clearcoatRoughness={.05} envMapIntensity={1.3} /></mesh>
    <Box p={[(X0 + X1) / 2, FLOOR + .012, 0]} s={[X1 - X0 - .3, .006, .04]} c={palette.gold} m={.9} r={.2} radius={0} cast={false} />
    <Box p={[(X0 + X1) / 2, 1.72, zb + .02]} s={[X1 - X0 - .12, 2.12, .02]} {...lin} />
    <Box p={[(X0 + D0 + .07) / 2, 1.72, Z - T - .02]} s={[D0 - X0 - .07, 2.12, .02]} {...lin} />
    <Box p={[(D1 + X1 - .07) / 2, 1.72, Z - T - .02]} s={[X1 - D1 - .07, 2.12, .02]} {...lin} />
    <Box p={[(D0 + D1) / 2, (DY1 + 2.79) / 2, Z - T - .02]} s={[D1 - D0, 2.79 - DY1, .02]} {...lin} />
    <Box p={[(D0 + D1) / 2, (FLOOR + DY0) / 2, Z - T - .02]} s={[D1 - D0, DY0 - FLOOR, .02]} {...lin} />
    <Box p={[X0 + T + .02, 1.72, 0]} s={[.02, 2.12, 2 * Z - .2]} {...lin} />
    <Box p={[X1 - T - .02, 1.72, 0]} s={[.02, 2.12, 2 * Z - .2]} c="#e5c3bf" r={.75} radius={0} cast={false} />
    <Box p={[(X0 + X1) / 2, 2.8, 0]} s={[X1 - X0 - .14, .02, 2 * Z - .16]} c="#fbf3ea" r={.6} radius={0} cast={false} />
    {[FLOOR + 1.16, 2.6].map(y => <Box key={y} p={[(X0 + X1) / 2, y, zb + .035]} s={[X1 - X0 - .14, .014, .012]} c={palette.goldBright} m={.9} r={.2} radius={0} cast={false} />)}
    {/* ceiling lights */}
    {[-2.2, -1.2, -.2, .8].flatMap(x => [-.5, .5].map(z => <mesh key={`${x}${z}`} position={[x, 2.785, z]} rotation-x={Math.PI / 2}><circleGeometry args={[.09, 20]} /><meshStandardMaterial color="#fff" emissive="#ffe6bf" emissiveIntensity={3.4} /></mesh>))}
    <GlowStrip p={[-.7, 2.78, 0]} s={[3.6, .012, .05]} />
    <pointLight position={[-.6, 2.5, 0]} intensity={4.4} distance={5.6} color="#ffd9aa" />
    <pointLight position={[-2, 2.2, -.3]} intensity={2.2} distance={4} color="#ffcfa0" />

    {/* shampoo station, rear on the -z wall */}
    <Box p={[-2.4, FLOOR + .4, -.74]} s={[.75, .8, .55]} c="#fffaf5" r={.3} radius={.03} clearcoat={.6} />
    <Box p={[-2.4, FLOOR + .81, -.74]} s={[.8, .035, .6]} c="#ffffff" r={.08} radius={.01} clearcoat={1} />
    <ShampooBowl p={[-2.4, FLOOR + .83, -.68]} />
    {[-.16, .16].map(dx => <Box key={dx} p={[-2.4 + dx, FLOOR + .42, -.455]} s={[.012, .28, .02]} c={palette.goldBright} m={1} r={.2} radius={.004} />)}
    <BarberChair p={[-2.4, FLOOR, -.08]} />
    {/* barber station */}
    <Box p={[-1.3, FLOOR + .4, -.84]} s={[1.3, .8, .34]} c="#fffaf5" r={.3} radius={.03} clearcoat={.6} />
    <Box p={[-1.3, FLOOR + .82, -.84]} s={[1.36, .035, .38]} c="#ffffff" r={.08} radius={.01} clearcoat={1} />
    <Box p={[-1.3, FLOOR + .84, -.66]} s={[1.3, .012, .012]} c={palette.gold} m={.9} r={.2} radius={0} />
    <MirrorReal p={[-1.3, 1.95, zb + .06]} w={1.05} h={1.05} near={5} />
    <Bottles p={[-1.75, FLOOR + .84, -.86]} n={6} span={.42} />
    <Cyl p={[-1.05, FLOOR + .94, -.88]} r={.04} h={.2} c="#f4d5d8" rough={.2} />
    <Box p={[-.85, FLOOR + .86, -.84]} s={[.24, .02, .16]} c={palette.gold} m={.9} r={.2} radius={.006} />
    <Box p={[-1.3, FLOOR + .86, -.84]} s={[.3, .03, .12]} c={palette.charcoal} m={.4} r={.3} radius={.01} />
    <Plant p={[-.72, FLOOR + .83, -.9]} s={.7} />
    <BarberChair p={[-1.3, FLOOR, -.2]} rot={[0, Math.PI + .25, 0]} />
    {/* lash and brow bed */}
    <group position={[.5, FLOOR, -.5]}>
      <Cyl p={[0, .1, 0]} r={.13} h={.2} c={palette.charcoal} rough={.35} />
      <Cyl p={[0, .1, 0]} r={.14} h={.04} c={palette.goldBright} m={1} rough={.2} />
      <Cyl p={[0, .27, 0]} r={.05} h={.28} c="#e9d3a8" m={1} rough={.2} />
      <Box p={[0, .42, 0]} s={[1.5, .13, .58]} c="#231d20" r={.28} radius={.06} clearcoat={.7} />
      <Box p={[-.62, .58, 0]} s={[.42, .11, .5]} c="#231d20" r={.28} radius={.05} rot={[0, 0, .3]} clearcoat={.7} />
      <Box p={[-.62, .58, 0]} s={[.26, .05, .3]} c="#f7e7de" r={.95} radius={.03} rot={[0, 0, .3]} />
    </group>
    <RingLight p={[-.28, 1.35, -.8]} rot={[0, 0, 0]} />
    <Cyl p={[-.28, .95, -.86]} r={.012} h={.8} c={palette.goldBright} m={1} rough={.2} />
    <Box p={[1.15, FLOOR + .35, -.86]} s={[.36, .7, .26]} c="#fffaf5" r={.3} radius={.03} />
    <Box p={[1.15, FLOOR + .71, -.86]} s={[.4, .02, .3]} c="#ffffff" r={.1} radius={.01} clearcoat={1} />
    {/* manicure station on the +z wall */}
    <Cyl p={[-1.95, FLOOR + .36, .55]} r={.04} h={.72} c={palette.goldBright} m={1} rough={.2} />
    <Cyl p={[-1.95, FLOOR + .035, .55]} r={.2} h={.03} c={palette.goldBright} m={1} rough={.2} />
    <mesh position={[-1.95, FLOOR + .74, .55]}><cylinderGeometry args={[.36, .36, .04, 36]} /><meshPhysicalMaterial map={floorTex} roughness={.08} clearcoat={1} /></mesh>
    <PolishRack p={[-1.95, FLOOR + .78, .4]} rows={2} n={6} w={.36} />
    <Box p={[-1.8, FLOOR + .82, .68]} s={[.18, .07, .12]} c="#f7f2ee" r={.3} radius={.03} />
    <Box p={[-2.12, FLOOR + .775, .62]} s={[.22, .04, .16]} c="#f4b6c6" r={.95} radius={.02} />
    <Vase p={[-1.78, FLOOR + .76, .48]} s={.9} />
    <PlushChair p={[-2.55, FLOOR, .55]} rot={[0, Math.PI / 2, 0]} />
    <PlushChair p={[-1.35, FLOOR, .55]} rot={[0, -Math.PI / 2, 0]} />
    {/* refreshment nook by the door */}
    <Box p={[1.1, FLOOR + .43, .72]} s={[.5, .86, .55]} c="#2c3438" m={.7} r={.25} radius={.02} />
    <Box p={[1.1, FLOOR + .43, .432]} s={[.42, .74, .012]} c="#9edcf5" e="#5fc2f0" ei={.9} radius={0} cast={false} />
    {[.2, .45, .68].map(y => <Box key={y} p={[1.1, FLOOR + y, .428]} s={[.4, .012, .02]} c="#dfe7ea" m={.8} r={.2} radius={0} cast={false} />)}
    <Box p={[1.1, FLOOR + .88, .72]} s={[.54, .03, .58]} c="#ffffff" r={.08} radius={.01} clearcoat={1} />
    <Box p={[1.12, FLOOR + .99, .74]} s={[.24, .18, .2]} c="#20292d" m={.6} r={.3} radius={.03} />
    <Cyl p={[.95, FLOOR + .93, .55]} r={.03} h={.08} c="#fff" rough={.2} />
    <Plant p={[1.1, FLOOR + .9, .95]} s={.7} />
    <Plant p={[1.15, FLOOR, -.75]} s={1.5} />
    <Plant p={[-2.62, FLOOR, .9]} s={1.3} />
    {mobile ? null : <Vase p={[.5, FLOOR + .84, -.84]} s={.8} bloom="#fff3f6" />}
  </group>;
}

export function Van({ open, ghost = false }: { open: boolean; ghost?: boolean }) {
  const mobile = useThree(s => s.size.width < 900);
  const tex = useMemo(() => getLivery(mobile ? 'van-s' : 'van', { width: mobile ? 1600 : 2560, height: mobile ? 912 : 1459, seed: 11, wordmarkY: livery.van.wordmarkY, taglineY: livery.van.taglineY, iconsY: livery.van.iconsY, wordmarkSize: livery.van.wordmarkSize, centerX: ((D0 + X0) / 2 - X0) / (X1 - X0), showPhone: true }), [mobile]);
  const cab = useMemo(cabGeometry, []);
  const plate = useMemo(plateTexture, []);
  const door = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (door.current) door.current.rotation.y = THREE.MathUtils.damp(door.current.rotation.y, open ? 1.45 : 0, 3.6, Math.min(dt, .05)); });
  const wheelZ = 1.06;
  return <group>
    {/* chassis and skirt */}
    <Box p={[-.7, .38, 0]} s={[5.3, .2, 2.02]} c={palette.wine} r={.4} radius={.04} />
    <Box p={[-.7, .5, 0]} s={[4.2, .05, 2.2]} c={gold} m={.9} r={.2} radius={0} cast={false} />
    {/* cargo shell */}
    <Box p={[(X0 + X1) / 2, .59, 0]} s={[X1 - X0, .09, 2 * Z]} c={ivory} radius={0} />
    <Box p={[(X0 + X1) / 2, Y1 - .035, 0]} s={[X1 - X0, .07, 2 * Z]} c={ivory} r={.24} radius={.035} clearcoat={1} />
    <Box p={[X0 + T / 2, (Y0 + Y1) / 2 + .1, 0]} s={[T, Y1 - Y0 - .2, 2 * Z]} c={ivory} radius={0} />
    <Box p={[X1 - T / 2, (Y0 + Y1) / 2 + .1, 0]} s={[T, Y1 - Y0 - .2, 2 * Z]} c={ivory} radius={0} />
    <Box p={[(X0 + X1) / 2, (Y0 + Y1) / 2 + .1, -Z + T / 2]} s={[X1 - X0, Y1 - Y0 - .2, T]} c={ivory} radius={0} />
    <TexPlane map={tex} total={TOTAL} seg={[X0, X1, Y0 + .1, Y1]} z={-Z - .003} flip />
    <Box p={[(X0 + D0) / 2, (Y0 + Y1) / 2 + .1, Z - T / 2]} s={[D0 - X0, Y1 - Y0 - .2, T]} c={ivory} radius={0} />
    <Box p={[(D1 + X1) / 2, (Y0 + Y1) / 2 + .1, Z - T / 2]} s={[X1 - D1, Y1 - Y0 - .2, T]} c={ivory} radius={0} />
    <Box p={[(D0 + D1) / 2, (DY1 + Y1) / 2, Z - T / 2]} s={[D1 - D0, Y1 - DY1, T]} c={ivory} radius={0} />
    <Box p={[(D0 + D1) / 2, (Y0 + DY0) / 2 + .08, Z - T / 2]} s={[D1 - D0, DY0 - Y0 - .16, T]} c={ivory} radius={0} />
    <TexPlane map={tex} total={TOTAL} seg={[X0, D0, Y0 + .1, Y1]} z={Z + .002} />
    <TexPlane map={tex} total={TOTAL} seg={[D1, X1, Y0 + .1, Y1]} z={Z + .002} />
    <TexPlane map={tex} total={TOTAL} seg={[D0, D1, DY1, Y1]} z={Z + .002} />
    <TexPlane map={tex} total={TOTAL} seg={[D0, D1, Y0 + .1, DY0]} z={Z + .002} />
    {/* rounded corner posts and roof rails */}
    {[-1, 1].map(s => <group key={s}>
      <Box p={[X0 - .005, (Y0 + Y1) / 2, s * (Z - .01)]} s={[.08, Y1 - Y0, .1]} c={ivory} r={.24} radius={.035} clearcoat={1} />
      <Box p={[(X0 + X1) / 2, Y1 + .01, s * (Z - .02)]} s={[X1 - X0 + .06, .05, .07]} c={ivory} r={.24} radius={.025} clearcoat={1} />
      <Box p={[(X0 + X1) / 2, 1.62, s * (Z + .012)]} s={[X1 - X0, .012, .012]} c={gold} m={.95} r={.18} radius={0} cast={false} />
    </group>)}
    {/* door frame trim, step and glow */}
    <Box p={[(D0 + D1) / 2, DY1 + .01, Z + .014]} s={[D1 - D0 + .07, .04, .03]} c={gold} m={.9} r={.2} radius={.006} />
    <Box p={[(D0 + D1) / 2, DY0 - .01, Z + .014]} s={[D1 - D0 + .07, .04, .03]} c={gold} m={.9} r={.2} radius={.006} />
    <Box p={[(D0 + D1) / 2, .52, Z + .22]} s={[D1 - D0 + .05, .07, .4]} c="#2a2426" m={.4} r={.4} radius={.02} />
    <Box p={[(D0 + D1) / 2, .555, Z + .22]} s={[D1 - D0 - .04, .012, .34]} c={gold} m={.9} r={.2} radius={0} cast={false} />
    <GlowStrip p={[(D0 + D1) / 2, .5, Z + .42]} s={[D1 - D0, .012, .014]} />
    {/* sliding door, swings open */}
    <group ref={door} position={[D1, 0, Z]}>
      <group position={[-D1, 0, -Z + .06]}>
        <TexPlane map={tex} total={TOTAL} seg={[D0, D1, DY0, DY1]} z={Z + .028} />
        <Box p={[(D0 + D1) / 2, (DY0 + DY1) / 2, Z + .01]} s={[D1 - D0 - .02, DY1 - DY0 - .02, .05]} c={ivory} r={.24} radius={.02} clearcoat={1} />
        <Box p={[(D0 + D1) / 2, 2.3, Z + .046]} s={[D1 - D0 - .3, .5, .01]} c="#0e1a22" m={.85} r={.03} radius={.01} clearcoat={1} />
        <Box p={[D0 + .12, 1.65, Z + .055]} s={[.05, .32, .035]} c="#dcdcdc" m={1} r={.12} radius={.012} />
      </group>
    </group>
    {!ghost && <Interior mobile={mobile} />}
    {/* rear detail */}
    <Box p={[X0 - .07, .66, 0]} s={[.14, .18, 2.0]} c="#2a2426" m={.4} r={.4} radius={.04} />
    <Box p={[X0 - .08, .74, 0]} s={[.03, .022, 1.94]} c={gold} m={.9} r={.2} radius={0} cast={false} />
    {[-.95, .95].map(z => <group key={z}><Box p={[X0 - .03, 1.35, z]} s={[.06, .62, .16]} c="#1d1a1c" r={.3} radius={.03} /><Box p={[X0 - .065, 1.35, z]} s={[.02, .54, .1]} c="#c72f45" e="#ff3b57" ei={1.4} radius={.012} cast={false} /></group>)}
    <Box p={[X0 - .012, 1.58, 0]} s={[.01, 1.5, .012]} c="#bdb3a8" radius={0} cast={false} />
    {[-.08, .08].map(z => <Box key={z} p={[X0 - .03, 1.5, z]} s={[.025, .16, .03]} c="#dcdcdc" m={1} r={.12} radius={.008} />)}
    <mesh position={[X0 - .022, .98, 0]} rotation-y={-Math.PI / 2}><planeGeometry args={[.42, .21]} /><meshStandardMaterial map={plate} roughness={.4} /></mesh>
    {/* cab, extruded so every edge is rounded */}
    <mesh geometry={cab} material={paint} castShadow receiveShadow />
    <Quad pts={[[2.53, 1.53, -.9], [2.53, 1.53, .9], [2.13, 2.44, .9], [2.13, 2.44, -.9]].map(([x, y, z]) => [x + .09 * .92, y + .09 * .39, z] as V3) as [V3, V3, V3, V3]} color="#0c161d" m={.85} r={.03} />
    <Quad pts={[[2.5, 1.5, -.96], [2.5, 1.5, .96], [2.09, 2.5, .96], [2.09, 2.5, -.96]].map(([x, y, z]) => [x + .075 * .92, y + .075 * .39, z] as V3) as [V3, V3, V3, V3]} color="#1a1517" m={.2} r={.4} coat={0} />
    {[-1, 1].map(s => <group key={s}>
      <mesh position={[0, 0, s * 1.045]} rotation-y={s > 0 ? 0 : Math.PI} material={glassMat}><shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(1.62, 1.62); sh.lineTo(2.35, 1.62); sh.lineTo(2.0, 2.44); sh.lineTo(1.62, 2.44); sh.closePath(); return sh; })()]} /></mesh>
      <Box p={[1.6, 1.6, s * 1.052]} s={[.02, 1.9, .01]} c="#1a1517" radius={0} cast={false} />
      <Box p={[2.5, 1.0, s * 1.052]} s={[.012, .95, .01]} c="#cfc7be" radius={0} cast={false} />
      <Box p={[1.76, 1.53, s * 1.06]} s={[.16, .035, .03]} c="#dcdcdc" m={1} r={.12} radius={.01} />
      <Box p={[1.95, 1.73, s * 1.06]} s={[.5, .014, .008]} c={gold} m={.9} r={.2} radius={0} cast={false} />
      {/* mirror, arm and housing */}
      <Box p={[2.44, 1.85, s * 1.15]} s={[.06, .04, .14]} c="#26201f" r={.4} radius={.01} />
      <Box p={[2.44, 1.9, s * 1.26]} s={[.1, .3, .16]} c={ivory} r={.24} radius={.045} clearcoat={1} />
      <Box p={[2.485, 1.9, s * 1.26]} s={[.006, .25, .12]} c="#c7d3da" m={1} r={.04} radius={.01} />
      <Box p={[2.86, 1.16, s * .68]} s={[.02, .12, .34]} c="#fff8e6" e="#ffe2a8" ei={2.6} radius={.04} cast={false} />
      <Box p={[3.06, 1.05, s * .74]} s={[.05, .16, .36]} c="#1a1517" r={.2} radius={.05} />
      <Box p={[3.085, 1.05, s * .74]} s={[.012, .12, .3]} c="#fff8e6" e="#ffe6b0" ei={2.6} radius={.04} cast={false} />
      <Box p={[3.083, 1.16, s * .74]} s={[.012, .012, .3]} c="#fff" e="#fff" ei={2} radius={0} cast={false} />
      <Box p={[3.06, .68, s * .8]} s={[.03, .07, .16]} c="#ffe9c0" e="#ffd08a" ei={1.5} radius={.02} cast={false} />
    </group>)}
    <Box p={[3.075, .86, 0]} s={[.03, .28, 1.02]} c="#171314" m={.4} r={.3} radius={.03} />
    {[.8, .86, .92].map(y => <Box key={y} p={[3.095, y, 0]} s={[.014, .02, .9]} c="#dcdcdc" m={1} r={.1} radius={.006} cast={false} />)}
    <mesh position={[3.1, .93, 0]} rotation-y={Math.PI / 2} material={paint}><circleGeometry args={[.07, 24]} /></mesh>
    <mesh position={[3.108, .93, 0]} rotation-y={Math.PI / 2}><ringGeometry args={[.05, .07, 24]} /><meshStandardMaterial color={gold} metalness={1} roughness={.2} /></mesh>
    <Box p={[3.03, .56, 0]} s={[.09, .18, 2.0]} c="#2a2426" m={.35} r={.4} radius={.04} />
    <Box p={[3.075, .54, 0]} s={[.02, .1, 1.5]} c="#0e0c0d" radius={.02} cast={false} />
    <Box p={[3.055, .66, 0]} s={[.02, .012, 2.0]} c={gold} m={.9} r={.2} radius={0} cast={false} />
    {[-.4, .4].map(z => <Box key={z} p={[2.55, 1.48, z]} s={[.014, .012, .5]} rot={[0, 0, -.42]} c="#0e0c0d" radius={0} cast={false} />)}
    {/* roof gear */}
    <Box p={[-1.4, 3.03, 0]} s={[1.15, .2, .85]} c={ivory} r={.3} radius={.09} clearcoat={1} />
    {[-.24, -.12, 0, .12, .24].map(z => <Box key={z} p={[-1.4, 3.135, z]} s={[.8, .012, .05]} c="#2a2426" radius={0} cast={false} />)}
    <Box p={[.3, 2.965, 0]} s={[.55, .09, .42]} c={ivory} r={.3} radius={.04} clearcoat={1} />
    <Cyl p={[-.35, 3.13, .6]} r={.012} h={.3} c="#1a1517" rough={.5} />
    <Box p={[(X0 + X1) / 2, 2.912, Z - .04]} s={[X1 - X0, .02, .02]} c={gold} m={.9} r={.2} radius={0} e="#ffd9a1" ei={.6} cast={false} />
    {/* wheels, arches and flares */}
    {[-1.65, 1.95].map(x => [-1, 1].map(s => <group key={`${x}${s}`}>
      <WheelArch x={x} z={s * (Z + .006)} radius={.53} />
      <Box p={[x, .98, s * (Z + .02)]} s={[1.1, .05, .1]} c={ivory} r={.24} radius={.02} clearcoat={1} />
      <Wheel x={x} z={s * wheelZ} radius={.44} out={s} />
    </group>))}
    {[-1.65].map(x => [-1, 1].map(s => <Box key={s} p={[x - .58, .35, s * 1.02]} s={[.03, .28, .3]} c="#141213" r={.9} radius={.01} />))}
    {!ghost && <pointLight position={[-.3, .18, 0]} intensity={1.6} distance={4.5} color="#ffb98a" />}
  </group>;
}
