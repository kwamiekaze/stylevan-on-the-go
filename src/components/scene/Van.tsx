import { useContext, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { palette, livery } from '@/config/brand';
import { cabTexture, getLivery, marbleTexture, plateTexture, rearTexture } from './livery';
import { FlashCtx, headMat, signalMat, tailMat } from './lights';
import { Ball, BarberChair, Bottles, Box, Cyl, GlowStrip, MirrorReal, Plant, PlushChair, PolishRack, Quad, RingLight, ShampooBowl, TexPlane, Vase, Wheel, WheelArch, Fender, type V3 } from './parts';

/** Cargo box extents in van local space (meters). */
const X0 = -2.85, X1 = 1.45, Y0 = .45, Y1 = 2.9, Z = 1.1, T = .07;
const D0 = -1.05, D1 = .75, DY0 = .78, DY1 = 2.62;
const FLOOR = .62;
const TOTAL: [number, number, number, number] = [X0, X1, Y0, Y1];
const OZ = .95, OY0 = .7, OY1 = 2.7; // rear doorway
const ivory = palette.ivory;
const LINING = '#efd3cf';
const gold = palette.goldBright;

const paint = new THREE.MeshPhysicalMaterial({ color: ivory, roughness: .24, metalness: .05, clearcoat: 1, clearcoatRoughness: .07, envMapIntensity: 1.25 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: '#0e1a22', roughness: .03, metalness: .85, clearcoat: 1, envMapIntensity: 1.8 });
const chrome = new THREE.MeshStandardMaterial({ color: '#dcdcdc', metalness: 1, roughness: .12 });
const rubber = new THREE.MeshStandardMaterial({ color: '#141213', roughness: .8 });

function FlashBeams() {
  const f = useContext(FlashCtx); const l = useRef<THREE.PointLight>(null);
  useFrame(() => { if (l.current) l.current.intensity = f.current * 7; });
  return <pointLight ref={l} position={[3.6, .9, 0]} intensity={0} distance={7} color="#ffe9c0" />;
}

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
    <Box p={[(X0 + X1) / 2, FLOOR + .03, 0]} s={[X1 - X0 - .3, .008, .04]} c={palette.gold} m={.9} r={.2} radius={0} cast={false} />
    <Box p={[(X0 + X1) / 2, 1.72, zb + .02]} s={[X1 - X0 - .12, 2.12, .02]} {...lin} />
    <Box p={[(X0 + D0 + .07) / 2, 1.72, Z - T - .02]} s={[D0 - X0 - .07, 2.12, .02]} {...lin} />
    <Box p={[(D1 + X1 - .07) / 2, 1.72, Z - T - .02]} s={[X1 - D1 - .07, 2.12, .02]} {...lin} />
    <Box p={[(D0 + D1) / 2, (DY1 + 2.79) / 2, Z - T - .02]} s={[D1 - D0, 2.79 - DY1, .02]} {...lin} />
    <Box p={[(D0 + D1) / 2, (FLOOR + DY0) / 2, Z - T - .02]} s={[D1 - D0, DY0 - FLOOR, .02]} {...lin} />
    {[-1, 1].map(s => <Box key={`rj${s}`} p={[X0 + T + .02, (OY0 + OY1) / 2, s * (OZ + .035)]} s={[.02, OY1 - OY0, .07]} {...lin} />)}
    <Box p={[X0 + T + .02, (OY1 + 2.79) / 2, 0]} s={[.02, 2.79 - OY1, 2 * Z - .2]} {...lin} />
    <Box p={[X0 + T + .02, (FLOOR + OY0) / 2, 0]} s={[.02, OY0 - FLOOR, 2 * Z - .2]} {...lin} />
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
    <Plant p={[-2.55, FLOOR, .68]} s={1.1} />
    {mobile ? null : <Vase p={[.5, FLOOR + .84, -.84]} s={.8} bloom="#fff3f6" />}
  </group>;
}

function RearDoors({ open }: { open: boolean }) {
  const rear = useMemo(() => { const t = rearTexture(); const l = t.clone(); l.repeat.set(.5, 1); l.offset.set(0, 0); l.needsUpdate = true; const r = t.clone(); r.repeat.set(.5, 1); r.offset.set(.5, 0); r.needsUpdate = true; return { l, r }; }, []);
  const refs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  useFrame((_, dt) => { refs.forEach((g, i) => { if (g.current) { const s = i === 0 ? -1 : 1; g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, open ? s * 1.95 : 0, 3, Math.min(dt, .05)); } }); });
  const H = OY1 - OY0 - .02, W = OZ + .02;
  return <group>
    {[-1, 1].map((s, i) => <group key={s} ref={refs[i]} position={[X0 - .01, (OY0 + OY1) / 2, s * (OZ + .02)]}>
      <group position={[0, 0, -s * W / 2]}>
        <Box p={[-.02, 0, 0]} s={[.05, H, W - .01]} c={ivory} r={.24} radius={.02} clearcoat={1} />
        <mesh position={[-.048, 0, 0]} rotation-y={-Math.PI / 2}><planeGeometry args={[W - .02, H - .02]} /><meshPhysicalMaterial map={s < 0 ? rear.l : rear.r} roughness={.3} clearcoat={1} clearcoatRoughness={.1} /></mesh>
        <Box p={[.012, 0, 0]} s={[.012, H - .06, W - .06]} c={LINING} r={.8} radius={0} cast={false} />
        <Box p={[-.056, -H / 2 + .02, 0]} s={[.008, .02, W - .02]} c={gold} m={.9} r={.2} radius={0} cast={false} />
        <Box p={[-.06, -.5, -s * (W / 2 - .06)]} s={[.02, .34, .03]} c="#dcdcdc" m={1} r={.1} radius={.01} />
        <Box p={[-.056, 0, -s * (W / 2 - .005)]} s={[.01, H - .04, .012]} c="#bdb3a8" radius={0} cast={false} />
      </group>
    </group>)}
  </group>;
}

export function Van({ open, ghost = false }: { open: boolean; ghost?: boolean }) {
  const mobile = useThree(s => s.size.width < 900);
  const tex = useMemo(() => getLivery(mobile ? 'van-s' : 'van', { kind: 'van', width: mobile ? 1600 : 2560, height: mobile ? 912 : 1459, seed: 11, wordmarkY: livery.van.wordmarkY, taglineY: livery.van.taglineY, iconsY: livery.van.iconsY, wordmarkSize: livery.van.wordmarkSize, centerX: ((D0 + X0) / 2 - X0) / (X1 - X0), showPhone: true }), [mobile]);
  const cab = useMemo(cabGeometry, []);
  const plate = useMemo(plateTexture, []);
  const door = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (door.current) door.current.rotation.y = THREE.MathUtils.damp(door.current.rotation.y, open ? 1.45 : 0, 3.6, Math.min(dt, .05)); });
  return <group>
    {/* chassis and skirt */}
    <Box p={[-.7, .38, 0]} s={[5.3, .2, 2.02]} c={palette.wine} r={.4} radius={.04} />
    <Box p={[-.7, .5, 0]} s={[4.2, .05, 2.2]} c={gold} m={.9} r={.2} radius={0} cast={false} />
    {/* cargo shell */}
    <Box p={[(X0 + X1) / 2, .55, 0]} s={[X1 - X0, .09, 2 * Z]} c={ivory} radius={0} />
    <Box p={[(X0 + X1) / 2, Y1 - .035, 0]} s={[X1 - X0, .07, 2 * Z]} c={ivory} r={.24} radius={.035} clearcoat={1} />
    {[-1, 1].map(s => <Box key={`rw${s}`} p={[X0 + T / 2, (OY0 + OY1) / 2, s * (OZ + (Z - OZ) / 2)]} s={[T, OY1 - OY0, Z - OZ]} c={ivory} radius={0} />)}
    <Box p={[X0 + T / 2, (OY1 + Y1) / 2 - .05, 0]} s={[T, Y1 - OY1 - .1, 2 * Z]} c={ivory} radius={0} />
    <Box p={[X0 + T / 2, (Y0 + .1 + OY0) / 2 + .05, 0]} s={[T, OY0 - Y0 - .1, 2 * Z]} c={ivory} radius={0} />
    <Box p={[X0 - .004, OY0 + .01, 0]} s={[.03, .03, 2 * OZ + .05]} c={gold} m={.9} r={.2} radius={0} cast={false} />
    <Box p={[X0 - .004, OY1 - .01, 0]} s={[.03, .03, 2 * OZ + .05]} c={gold} m={.9} r={.2} radius={0} cast={false} />
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
      {s > 0
        ? <Box p={[(D1 + X1) / 2, 1.62, Z + .012]} s={[X1 - D1, .012, .012]} c={gold} m={.95} r={.18} radius={0} cast={false} />
        : <Box p={[(X0 - .4) / 2, 1.62, -Z - .012]} s={[-.4 - X0, .012, .012]} c={gold} m={.95} r={.18} radius={0} cast={false} />}
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
    {/* rear: bumper, plate, lights, hitch, exhaust, doors */}
    <Box p={[X0 - .08, .6, 0]} s={[.16, .3, 2.06]} c="#2a2426" m={.4} r={.4} radius={.05} />
    <Box p={[X0 - .162, .72, 0]} s={[.01, .02, 1.9]} c="#4a4446" radius={0} cast={false} />
    <Box p={[X0 - .16, .48, 0]} s={[.01, .02, 1.9]} c={gold} m={.9} r={.2} radius={0} cast={false} />
    <mesh position={[X0 - .166, .6, 0]} rotation-y={-Math.PI / 2}><planeGeometry args={[.3, .15]} /><meshStandardMaterial map={plate} roughness={.4} /></mesh>
    {[-1, 1].map(s => <group key={`tl${s}`}>
      <Box p={[X0 - .03, 1.7, s * (Z - .045)]} s={[.07, .78, .12]} c="#1d1a1c" r={.3} radius={.03} />
      <mesh position={[X0 - .068, 1.86, s * (Z - .045)]} material={tailMat}><boxGeometry args={[.02, .4, .08]} /></mesh>
      <mesh position={[X0 - .068, 1.5, s * (Z - .045)]} material={signalMat}><boxGeometry args={[.02, .12, .08]} /></mesh>
      <mesh position={[X0 - .068, 1.3, s * (Z - .045)]} material={headMat}><boxGeometry args={[.02, .1, .08]} /></mesh>
      <Box p={[X0 - .1, .6, s * .8]} s={[.03, .08, .08]} c="#dcdcdc" m={1} r={.12} radius={.01} />
    </group>)}
    <mesh position={[X0 - .022, 2.86, 0]} material={tailMat}><boxGeometry args={[.03, .04, .5]} /></mesh>
    <Box p={[X0 - .2, .44, 0]} s={[.2, .12, .16]} c="#1a1517" m={.6} r={.4} radius={.02} />
    <Cyl p={[X0 - .34, .5, 0]} r={.022} h={.16} c="#dcdcdc" m={1} rough={.15} />
    <Ball p={[X0 - .34, .59, 0]} r={.04} c="#dcdcdc" m={1} rough={.12} />
    <Cyl p={[X0 - .05, .3, -.7]} r={.045} h={.9} c="#3a3638" m={.85} rough={.4} rot={[0, 0, Math.PI / 2]} />
    <Cyl p={[X0 - .5, .3, -.7]} r={.052} h={.1} c="#e6e6e6" m={1} rough={.1} rot={[0, 0, Math.PI / 2]} />
    <Cyl p={[-1.1, .3, -.7]} r={.09} h={.5} c="#4a4648" m={.85} rough={.4} rot={[0, 0, Math.PI / 2]} />
    <RearDoors open={open} />
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
      <mesh position={[2.86, 1.16, s * .68]} material={signalMat}><boxGeometry args={[.02, .1, .2]} /></mesh>
      <Box p={[3.06, 1.05, s * .74]} s={[.05, .16, .36]} c="#1a1517" r={.2} radius={.05} />
      <mesh position={[3.087, 1.05, s * .78]} material={headMat}><boxGeometry args={[.012, .11, .2]} /></mesh>
      <mesh position={[3.087, 1.05, s * .62]} material={signalMat}><boxGeometry args={[.012, .11, .1]} /></mesh>
      <mesh position={[3.087, 1.15, s * .74]} material={headMat}><boxGeometry args={[.012, .012, .3]} /></mesh>
      <mesh position={[3.06, .68, s * .8]} material={headMat}><boxGeometry args={[.03, .07, .16]} /></mesh>
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
    {/* roof rack, antenna, clearance lights */}
    {[-1, 1].map(s => <group key={`rack${s}`}>
      <Cyl p={[-.7, 3.0, s * .75]} r={.016} h={3.6} c="#dcdcdc" m={1} rough={.15} rot={[0, 0, Math.PI / 2]} />
      {[-2.5, -.7, 1.1].map(x => <Cyl key={x} p={[x, 2.95, s * .75]} r={.014} h={.1} c="#dcdcdc" m={1} rough={.15} />)}
    </group>)}
    {[-2.5, 1.1].map(x => <Cyl key={`xb${x}`} p={[x, 3.0, 0]} r={.016} h={1.5} c="#dcdcdc" m={1} rough={.15} rot={[Math.PI / 2, 0, 0]} />)}
    <Box p={[1.0, 2.96, -.55]} s={[.2, .07, .05]} c={ivory} r={.24} radius={.02} rot={[0, 0, .25]} clearcoat={1} />
    {[-.5, -.25, 0, .25, .5].map(z => <mesh key={`cm${z}`} position={[2.02, 2.7, z]} material={signalMat}><boxGeometry args={[.05, .035, .07]} /></mesh>)}
    {[-.6, .6].map(z => <mesh key={`rm${z}`} position={[X0 - .022, 2.83, z]} material={signalMat}><boxGeometry args={[.03, .04, .08]} /></mesh>)}
    {[-1, 1].flatMap(s => [X0 + .12, X1 - .12].map(x => <mesh key={`sm${s}${x}`} position={[x, 1.02, s * (Z + .014)]} material={signalMat}><boxGeometry args={[.1, .045, .012]} /></mesh>))}
    {/* front: fog lights, projector lenses, plate, tow hooks, mirror signals */}
    {[-1, 1].map(s => <group key={`fr${s}`}>
      <Cyl p={[3.08, .58, s * .82]} r={.045} h={.02} c="#fff8e6" rough={.1} rot={[0, 0, Math.PI / 2]} />
      <mesh position={[3.093, 1.05, s * .66]} material={headMat}><sphereGeometry args={[.035, 12, 8]} /></mesh>
      <mesh position={[2.5, 1.98, s * 1.27]} material={signalMat}><boxGeometry args={[.014, .03, .1]} /></mesh>
      <Box p={[3.05, .6, s * .55]} s={[.06, .05, .05]} c="#c9302c" m={.5} r={.4} radius={.015} />
    </group>)}
    <mesh position={[3.083, .56, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[.3, .15]} /><meshStandardMaterial map={plate} roughness={.4} /></mesh>
    {/* underbody */}
    <Box p={[-.3, .3, .6]} s={[1.0, .2, .45]} c="#2c292b" m={.5} r={.5} radius={.03} />
    <Box p={[-1.05, .3, -.4]} s={[.45, .18, .3]} c="#3a3638" m={.7} r={.4} radius={.03} />
    {[-.5, .5].map(z => <Box key={`ls${z}`} p={[-1.65, .5, z * 1.7]} s={[.9, .04, .08]} c="#2c292b" m={.6} r={.5} radius={.01} />)}
    {/* wheels sit fully outside the body so no tire ever passes through a floor or wall */}
    {[[-1.65, Z + .13, Z], [1.95, 1.19, 1.05]].map(([x, wz, wall]) => [-1, 1].map(s => <group key={`${x}${s}`}>
      <WheelArch x={x} z={s * (wall + .006)} radius={.5} />
      <Wheel x={x} z={s * wz} radius={.42} out={s} />
      <Fender x={x} z={s * wz} r={.42} len={.38} />
    </group>))}
    {[-1.65, 1.95].map(x => [-1, 1].map(s => <Cyl key={`ax${x}${s}`} p={[x, .42, 0]} r={.05} h={2.4} c="#3a3638" m={.8} rough={.5} rot={[Math.PI / 2, 0, 0]} />)).slice(0, 1)}
    <Cyl p={[.15, .3, 0]} r={.05} h={3.6} c="#3a3638" m={.8} rough={.5} rot={[0, 0, Math.PI / 2]} />
    {[-1.65].map(x => [-1, 1].map(s => <Box key={s} p={[x - .62, .33, s * 1.3]} s={[.03, .3, .32]} c="#141213" r={.9} radius={.01} />))}
    {!ghost && <pointLight position={[-.3, .18, 0]} intensity={1.6} distance={4.5} color="#ffb98a" />}
    {!ghost && <FlashBeams />}
  </group>;
}
