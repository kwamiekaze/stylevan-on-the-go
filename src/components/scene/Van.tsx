import { useContext, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard, RoundedBox } from '@react-three/drei';
import { palette } from '@/config/brand';
import { frontHeaderTexture, getLivery, marbleTexture, plateTexture, rearTexture, VAN_UV } from './livery';
import { FlashCtx, headMat, signalMat, tailMat } from './lights';
import { Ball, BarberChair, Bottles, Box, Cyl, GlowStrip, MirrorReal, Plant, PlushChair, PolishRack, RingLight, ShampooBowl, TexPlane, Vase, type V3 } from './parts';
import { ArchCover, RearDoors, SideWalls, Wheel, WheelWell, type SideSpec } from './Body';

/*
 * Step van, modelled on a real walk-in delivery van. Metres, x forward, y up, z to the right.
 * Box body x -2.85..2.55, roof 2.9, body sides from y 0.5, half width 1.1, corner radius 0.12.
 * Nose (hood and grille) x 2.55..3.16 up to y 1.35. Rear axle dual wheels at x -1.55, front at 2.35.
 * Cargo room x -2.85..1.35 behind a bulkhead, cab 1.35..2.55. Side service opening on the +z side.
 */
const X0 = -2.85, X1 = 1.35, XF = 2.55, RC = .12, Y0 = .5, Y1 = 2.9, Z = 1.1, T = .06;
const D0 = -2.2, D1 = -.45, DY0 = .95, DY1 = 2.6;
const FLOOR = .62;
const RX = -1.55, FX = 2.35, WR = .40, AR = .5; // 225/70R19.5 class tire, about 0.8 m tall
const ivory = palette.ivory;
const LINING = '#efd3cf';
const gold = palette.goldBright;
const TOP = Y1 - RC;
const TOTAL: [number, number, number, number] = [VAN_UV.x0, VAN_UV.x1, VAN_UV.y0, VAN_UV.y1];

const paint = new THREE.MeshPhysicalMaterial({ color: ivory, roughness: .22, metalness: .05, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.25 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: '#16242d', roughness: .03, metalness: .2, clearcoat: 1, transparent: true, opacity: .5, envMapIntensity: 1.8 });
const rubber = new THREE.MeshStandardMaterial({ color: '#131112', roughness: .85 });
const chrome = new THREE.MeshStandardMaterial({ color: '#dcdcdc', metalness: .7, roughness: .3, envMapIntensity: .7 });
const darkMetal = new THREE.MeshStandardMaterial({ color: '#2b2729', metalness: .6, roughness: .45 });

let glowTex: THREE.CanvasTexture | null = null;
function glow() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,244,214,.9)'); gr.addColorStop(.5, 'rgba(255,224,160,.25)'); gr.addColorStop(1, 'rgba(255,210,140,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); glowTex = new THREE.CanvasTexture(c); return glowTex;
}

/** Headlights and front signals flash with the key fob: a glow on each lens and a beam on the ground in front. */
function FlashBeams() {
  const f = useContext(FlashCtx);
  const lights = [useRef<THREE.SpotLight>(null), useRef<THREE.SpotLight>(null)];
  const head = useMemo(() => new THREE.MeshBasicMaterial({ map: glow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }), []);
  const amber = useMemo(() => new THREE.MeshBasicMaterial({ map: glow(), color: '#ffab3d', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }), []);
  const target = useMemo(() => { const o = new THREE.Object3D(); o.position.set(7, 0, 0); return o; }, []);
  useFrame(() => { const k = f.current; head.opacity = k; amber.opacity = k; lights.forEach(l => { if (l.current) l.current.intensity = k * 14; }); });
  return <group>
    <primitive object={target} />
    {[-1, 1].map((s, i) => <group key={s}>
      <Billboard position={[3.26, 1.04, s * .82]}><mesh material={head}><planeGeometry args={[.75, .75]} /></mesh></Billboard>
      <Billboard position={[3.25, .84, s * .82]}><mesh material={amber}><planeGeometry args={[.36, .36]} /></mesh></Billboard>
      <spotLight ref={lights[i]} position={[3.3, 1.04, s * .82]} target={target} angle={.55} penumbra={.7} distance={9} intensity={0} color="#fff1d6" />
    </group>)}
  </group>;
}

const arches = [{ a: RX, b: RX, cy: WR, r: AR }, { a: FX, b: FX, cy: WR, r: AR }];
const front: [number, number][] = [[XF, 1.35], [XF - RC, 1.35], [XF - RC, TOP]];
const WIN: [number, number, number, number] = [1.6, 2.15, 1.62, 2.38];
const PLUS: SideSpec = { x0: X0 + RC, x1: XF, y0: Y0, y1: TOP, arches, front, holes: [[D0, D1, DY0, DY1], WIN], uv: TOTAL };
const MINUS: SideSpec = { ...PLUS, holes: [WIN] };

/** Hood and grille housing, extruded from its side profile with the front arch cut out. */
function noseGeometry() {
  const s = new THREE.Shape();
  const yb = .6, a1 = Math.asin((yb - WR) / AR), a2 = Math.acos((XF - FX) / AR);
  s.moveTo(XF, 1.35); s.lineTo(3.0, 1.34); s.quadraticCurveTo(3.16, 1.32, 3.16, 1.18); s.lineTo(3.16, yb); s.lineTo(FX + AR * Math.cos(a1), yb);
  for (let i = 1; i <= 16; i++) { const t = a1 + ((a2 - a1) * i) / 16; s.lineTo(FX + AR * Math.cos(t), WR + AR * Math.sin(t)); }
  s.lineTo(XF, 1.35);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.96, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 4, curveSegments: 8 });
  g.translate(0, 0, -.98); return g;
}

/** Front face above the nose with two windshield openings. */
function frontFaceGeometry() {
  const w = Z - RC, s = new THREE.Shape([[-w, 1.35], [w, 1.35], [w, TOP], [-w, TOP]].map(([x, y]) => new THREE.Vector2(x, y)));
  [[-.93, -.05], [.05, .93]].forEach(([a, b]) => s.holes.push(new THREE.Path([[a, 1.52], [b, 1.52], [b, 2.4], [a, 2.4]].map(([x, y]) => new THREE.Vector2(x, y)))));
  const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(XF - T, 0, 0); return g;
}

function Interior({ mobile }: { mobile: boolean }) {
  const floorTex = useMemo(() => { const t = marbleTexture().clone(); t.repeat.set(3, 1.6); t.needsUpdate = true; return t; }, []);
  const zb = -Z + T + .01;
  const lin = { c: LINING, r: .75, radius: 0 as const, cast: false };
  return <group>
    {/* floor and lining, all facing inward so they read from inside the van */}
    {[[X0 + .05, RX - .55], [RX + .55, X1 - .05]].map(([a, b]) => <mesh key={a} position={[(a + b) / 2, FLOOR - .015, 0]} receiveShadow><boxGeometry args={[b - a, .05, 2 * Z - .12]} /><meshPhysicalMaterial map={floorTex} roughness={.12} clearcoat={1} clearcoatRoughness={.05} envMapIntensity={1.3} /></mesh>)}
    <mesh position={[RX, FLOOR - .015, 0]} receiveShadow><boxGeometry args={[1.1, .05, 2 * (Z - .54)]} /><meshPhysicalMaterial map={floorTex} roughness={.12} clearcoat={1} clearcoatRoughness={.05} envMapIntensity={1.3} /></mesh>
    {[-1, 1].map(s => <group key={`wh${s}`}><Box p={[RX, (FLOOR + .92) / 2 - .02, s * .77]} s={[1.14, .92 - FLOOR + .04, .44]} c={LINING} r={.75} radius={.04} cast={false} /><Box p={[RX, (FLOOR + .92) / 2 - .02, s * .994]} s={[1.2, .92 - FLOOR + .1, .008]} c="#141112" r={.95} radius={0} cast={false} /></group>)}
    <Box p={[(X0 + X1) / 2, FLOOR + .03, 0]} s={[X1 - X0 - .3, .008, .04]} c={palette.gold} m={.9} r={.2} radius={0} cast={false} />
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
    {[-2.3, -1.4, -.5, .5].flatMap(x => [-.5, .5].map(z => <mesh key={`${x}${z}`} position={[x, 2.785, z]} rotation-x={Math.PI / 2}><circleGeometry args={[.09, 20]} /><meshStandardMaterial color="#fff" emissive="#ffe6bf" emissiveIntensity={3.4} /></mesh>))}
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
    <MirrorReal p={[-1.3, 1.95, zb + .06]} w={1.05} h={1.05} near={7.5} />
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
    <Box p={[1.05, FLOOR + .35, -.86]} s={[.36, .7, .26]} c="#fffaf5" r={.3} radius={.03} />
    <Box p={[1.05, FLOOR + .71, -.86]} s={[.4, .02, .3]} c="#ffffff" r={.1} radius={.01} clearcoat={1} />
    {/* manicure station on the +z wall */}
    <Cyl p={[-1.95, FLOOR + .36, .55]} r={.04} h={.72} c={palette.goldBright} m={1} rough={.2} />
    <Cyl p={[-1.95, FLOOR + .035, .55]} r={.2} h={.03} c={palette.goldBright} m={1} rough={.2} />
    <mesh position={[-1.95, FLOOR + .74, .55]}><cylinderGeometry args={[.36, .36, .04, 36]} /><meshPhysicalMaterial map={floorTex} roughness={.08} clearcoat={1} /></mesh>
    <PolishRack p={[-1.95, FLOOR + .78, .4]} rows={2} n={6} w={.36} />
    <Box p={[-1.8, FLOOR + .82, .68]} s={[.18, .07, .12]} c="#f7f2ee" r={.3} radius={.03} />
    <Box p={[-2.12, FLOOR + .775, .62]} s={[.22, .04, .16]} c="#f4b6c6" r={.95} radius={.02} />
    <Vase p={[-1.78, FLOOR + .76, .48]} s={.9} />
    <PlushChair p={[-2.55, FLOOR, .55]} rot={[0, Math.PI / 2, 0]} />
    <PlushChair p={[-1.3, FLOOR, .42]} rot={[0, -Math.PI / 2, 0]} />
    {/* refreshment nook by the door */}
    <Box p={[1.0, FLOOR + .43, .72]} s={[.5, .86, .55]} c="#2c3438" m={.7} r={.25} radius={.02} />
    <Box p={[1.0, FLOOR + .43, .432]} s={[.42, .74, .012]} c="#9edcf5" e="#5fc2f0" ei={.9} radius={0} cast={false} />
    {[.2, .45, .68].map(y => <Box key={y} p={[1.0, FLOOR + y, .428]} s={[.4, .012, .02]} c="#dfe7ea" m={.8} r={.2} radius={0} cast={false} />)}
    <Box p={[1.0, FLOOR + .88, .72]} s={[.54, .03, .58]} c="#ffffff" r={.08} radius={.01} clearcoat={1} />
    <Box p={[1.02, FLOOR + .99, .74]} s={[.24, .18, .2]} c="#20292d" m={.6} r={.3} radius={.03} />
    <Cyl p={[.95, FLOOR + .93, .55]} r={.03} h={.08} c="#fff" rough={.2} />
    <Plant p={[1.0, FLOOR + .9, .95]} s={.7} />
    <Plant p={[1.05, FLOOR, -.75]} s={1.4} />
    <Plant p={[-2.55, FLOOR, .68]} s={1.1} />
    {mobile ? null : <Vase p={[.5, FLOOR + .84, -.84]} s={.8} bloom="#fff3f6" />}
  </group>;
}


function ServiceDoor({ open, tex }: { open: boolean; tex: THREE.Texture }) {
  const awning = useRef<THREE.Group>(null), steps = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const d = Math.min(dt, .05);
    if (awning.current) awning.current.rotation.x = THREE.MathUtils.damp(awning.current.rotation.x, open ? -1.5 : 0, 3, d);
    if (steps.current) steps.current.position.z = THREE.MathUtils.damp(steps.current.position.z, open ? 0 : -.62, 3, d);
  });
  const h = DY1 - DY0, w = D1 - D0, cx = (D0 + D1) / 2;
  return <group>
    <group ref={awning} position={[0, DY1, Z + .02]}>
      <group position={[0, -h / 2, 0]}>
        <group position={[0, -(DY0 + DY1) / 2, 0]}><TexPlane map={tex} total={TOTAL} seg={[D0, D1, DY0, DY1]} z={.032} /></group>
        <Box p={[cx, 0, 0]} s={[w - .02, h, .05]} c={ivory} r={.22} radius={.02} clearcoat={1} />
        <Box p={[cx, 0, -.03]} s={[w - .1, h - .1, .012]} c="#f6ece6" r={.6} radius={.01} />
        {[-.55, 0, .55].flatMap(dx => [-.45, .35].map(dy => <mesh key={`${dx}${dy}`} position={[cx + dx, dy, -.04]}><circleGeometry args={[.045, 16]} /><meshStandardMaterial color="#fff" emissive="#ffe3b8" emissiveIntensity={open ? 3 : 0} side={THREE.DoubleSide} /></mesh>))}
        <Box p={[cx, -h / 2 + .03, .04]} s={[w, .04, .05]} c={gold} m={.9} r={.2} radius={.01} />
      </group>
    </group>
    {open && [D0 + .08, D1 - .08].map(x => <mesh key={x} position={[x, 2.225, Z + .485]} rotation-x={1.037}><cylinderGeometry args={[.014, .014, 1.08, 8]} /><meshStandardMaterial color="#1a1718" metalness={.8} roughness={.3} /></mesh>)}
    {/* fold out steps: three treads between solid side plates, slide out from under the sill */}
    <group ref={steps} position={[D1 - .31, 0, -.62]}>
      {[[.8, .2], [.6, .46], [.4, .72]].map(([y, dz], i) => <group key={i}>
        <mesh position={[0, y, Z + dz]} material={darkMetal} castShadow><boxGeometry args={[.56, .04, .27]} /></mesh>
        <GlowStrip p={[0, y + .024, Z + dz + .13]} s={[.52, .01, .012]} />
      </group>)}
      {[-.29, .29].map(x => <mesh key={x} position={[x, .6, Z + .46]} rotation-x={.656} material={darkMetal}><boxGeometry args={[.025, .07, .72]} /></mesh>)}
    </group>
  </group>;
}

function Cab() {
  return <group>
    {/* cab floor, engine doghouse and wheel housings */}
    <Box p={[(X1 + 1.85) / 2, FLOOR - .015, 0]} s={[1.85 - X1, .05, 2 * Z - .12]} c="#2a2627" r={.8} radius={0} cast={false} />
    <Box p={[2.2, .85, 0]} s={[.7, .5, .7]} c="#2a2627" r={.7} radius={.08} />
    {[-1, 1].map(s => <Box key={s} p={[FX, .8, s * .775]} s={[.9, .56, .43]} c="#2a2627" r={.8} radius={.06} />)}
    <Box p={[X1 + T / 2 + .03, 1.72, 0]} s={[.02, 2.2, 2 * Z - .14]} c="#3a3436" r={.8} radius={0} cast={false} />
    <Box p={[(X1 + XF) / 2, 2.82, 0]} s={[XF - X1, .02, 2 * Z - .14]} c="#3a3436" r={.8} radius={0} cast={false} />
    {/* dashboard, gauges, steering wheel, seat */}
    <Box p={[2.38, 1.3, 0]} s={[.3, .32, 2 * Z - .16]} c="#1e1b1c" r={.6} radius={.06} />
    <Box p={[2.3, 1.47, -.55]} s={[.08, .08, .5]} c="#101010" e="#6fc1ff" ei={.4} radius={.02} />
    <group position={[2.12, 1.55, -.55]} rotation={[0, 0, .55]}>
      <mesh rotation-y={Math.PI / 2}><torusGeometry args={[.2, .02, 10, 32]} /><meshStandardMaterial color="#141213" roughness={.5} /></mesh>
      <Cyl p={[.12, 0, 0]} r={.025} h={.28} c="#141213" rot={[0, 0, Math.PI / 2]} />
    </group>
    <group position={[1.7, FLOOR, -.55]}>
      <Box p={[0, .4, 0]} s={[.5, .12, .5]} c="#2a2426" r={.7} radius={.05} />
      <Box p={[-.22, .78, 0]} s={[.12, .7, .5]} c="#2a2426" r={.7} radius={.05} rot={[0, 0, -.12]} />
      <Cyl p={[0, .2, 0]} r={.05} h={.35} c="#3a3638" m={.7} />
    </group>
  </group>;
}

function Nose() {
  const nose = useMemo(noseGeometry, []);
  const plate = useMemo(plateTexture, []);
  return <group>
    <mesh geometry={nose} material={paint} castShadow receiveShadow />
    {/* grille */}
    <Box p={[3.2, .96, 0]} s={[.04, .56, 1.2]} c="#1a1718" r={.5} radius={.02} />
    <Box p={[3.215, .96, 0]} s={[.03, .6, 1.24]} c="#e6e6e6" m={1} r={.1} radius={.025} />
    <Box p={[3.222, .96, 0]} s={[.03, .52, 1.14]} c="#161415" r={.5} radius={.01} />
    {[.76, .84, .92, 1.0, 1.08, 1.16].map(y => <mesh key={y} position={[3.232, y, 0]} material={chrome}><boxGeometry args={[.02, .03, 1.12]} /></mesh>)}
    {/* headlights in square chrome bezels, amber signals below */}
    {[-1, 1].map(s => <group key={s} position={[3.2, 1.04, s * .82]}>
      <mesh material={chrome}><boxGeometry args={[.04, .26, .26]} /></mesh>
      <mesh position-x={.021} material={rubber}><boxGeometry args={[.01, .22, .22]} /></mesh>
      <mesh position-x={.012} rotation-z={-Math.PI / 2} material={headMat}><sphereGeometry args={[.09, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh position={[.014, -.2, 0]} material={signalMat}><boxGeometry args={[.03, .08, .16]} /></mesh>
      <mesh position={[.005, -.2, 0]} material={chrome}><boxGeometry args={[.03, .1, .18]} /></mesh>
    </group>)}
    {/* bumper, plate, tow hooks */}
    <Box p={[3.27, .6, 0]} s={[.16, .26, 2.12]} c="#1a1718" m={.2} r={.55} radius={.04} />
    <Box p={[3.35, .66, 0]} s={[.01, .015, 2.0]} c="#3a3638" radius={0} cast={false} />
    <mesh position={[3.352, .58, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[.3, .15]} /><meshStandardMaterial map={plate} roughness={.4} /></mesh>
    {[-.62, .62].map(z => <mesh key={z} position={[3.33, .5, z]} rotation-z={Math.PI / 2}><torusGeometry args={[.045, .014, 8, 16]} /><meshStandardMaterial color="#c9302c" metalness={.4} roughness={.4} /></mesh>)}
    {[-1, 1].map(s => <mesh key={s} position={[3.35, .6, s * .85]} rotation-z={Math.PI / 2} material={headMat}><cylinderGeometry args={[.045, .045, .02, 18]} /></mesh>)}
  </group>;
}

function Glass() {
  const header = useMemo(frontHeaderTexture, []);
  const face = useMemo(frontFaceGeometry, []);
  return <group>
    <mesh geometry={face} material={paint} castShadow />
    <mesh position={[XF + .003, 2.62, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[1.5, .44]} /><meshBasicMaterial map={header} transparent toneMapped={false} /></mesh>
    {/* windshield panes, rubber surround, centre post, wipers */}
    {[-1, 1].map(s => <group key={s}>
      <mesh position={[XF - .02, 1.96, s * .49]} rotation-y={Math.PI / 2} material={glassMat}><planeGeometry args={[.88, .88]} /></mesh>
      <mesh position={[XF + .004, 1.96, s * .49]} rotation-y={Math.PI / 2}><ringGeometry args={[.6, .63, 4, 1, Math.PI / 4]} /><meshStandardMaterial color="#131112" roughness={.8} /></mesh>
      <group position={[XF + .03, 1.55, s * .1]} rotation={[s * -.18, 0, 0]}><mesh position={[0, 0, s * .36]} material={rubber}><boxGeometry args={[.018, .018, .72]} /></mesh></group>
    </group>)}
    <Box p={[XF + .002, 1.96, 0]} s={[.02, .9, .1]} c={ivory} r={.22} radius={.01} clearcoat={1} />
    {/* cab side windows */}
    {[-1, 1].map(s => <group key={s}>
      <mesh position={[(WIN[0] + WIN[1]) / 2, (WIN[2] + WIN[3]) / 2, s * (Z - .03)]} rotation-y={s > 0 ? 0 : Math.PI} material={glassMat}><planeGeometry args={[WIN[1] - WIN[0], WIN[3] - WIN[2]]} /></mesh>
    </group>)}
    {/* amber cab markers on the roof front edge */}
    {[-.5, -.25, 0, .25, .5].map(z => <mesh key={z} position={[XF + .005, 2.84, z]} material={signalMat}><boxGeometry args={[.04, .035, .08]} /></mesh>)}
  </group>;
}

/** Rounded roof, corner posts and top edges. */
function Shell() {
  const w = Z - RC;
  return <group>
    <mesh position={[(X0 + RC + XF - RC) / 2, Y1 - .02, 0]} material={paint} castShadow receiveShadow><boxGeometry args={[XF - X0 - 2 * RC, .03, 2 * w]} /></mesh>
    {[-1, 1].map(s => <mesh key={`te${s}`} position={[(X0 + XF) / 2, TOP, s * w]} rotation-z={Math.PI / 2} material={paint}><cylinderGeometry args={[RC, RC, XF - X0 - 2 * RC, 20, 1, true]} /></mesh>)}
    {[X0 + RC, XF - RC].map(x => <mesh key={`fe${x}`} position={[x, TOP, 0]} rotation-x={Math.PI / 2} material={paint}><cylinderGeometry args={[RC, RC, 2 * w, 20, 1, true]} /></mesh>)}
    {[X0 + RC, XF - RC].flatMap(x => [-1, 1].map(s => <mesh key={`cs${x}${s}`} position={[x, TOP, s * w]} material={paint}><sphereGeometry args={[RC, 16, 12]} /></mesh>))}
    {[-1, 1].map(s => <mesh key={`rp${s}`} position={[X0 + RC, (Y0 + TOP) / 2, s * w]} material={paint} castShadow><cylinderGeometry args={[RC, RC, TOP - Y0, 20, 1, true]} /></mesh>)}
    {[-1, 1].map(s => <mesh key={`fp${s}`} position={[XF - RC, (1.35 + TOP) / 2, s * w]} material={paint} castShadow><cylinderGeometry args={[RC, RC, TOP - 1.35, 20, 1, true]} /></mesh>)}
    {/* rear wall */}
    <mesh position={[X0 + T / 2, (Y0 + TOP) / 2, 0]} material={paint}><boxGeometry args={[T, TOP - Y0, 2 * w]} /></mesh>
    {/* underbody closure, kept clear of the wheels */}
    <mesh position={[(X0 + XF) / 2, Y0 + .03, 0]} material={darkMetal}><boxGeometry args={[XF - X0 - .1, .02, 2 * (Z - .56)]} /></mesh>
    {[[X0 + .1, RX - AR - .02], [RX + AR + .02, FX - AR - .02]].map(([a, b]) => [-1, 1].map(s => <mesh key={`uc${a}${s}`} position={[(a + b) / 2, Y0 + .03, s * (Z - .28)]} material={darkMetal}><boxGeometry args={[b - a, .02, .56]} /></mesh>))}
    {/* rub rail and gold pinstripe low on the body, broken at the arches */}
    {[[X0 + RC, RX - AR - .03], [RX + AR + .03, D0 - .02 > RX + AR ? FX - AR - .03 : FX - AR - .03]].map(([a, b]) => [-1, 1].map(s => <mesh key={`rr${a}${s}`} position={[(a + b) / 2, Y0 + .06, s * (Z + .012)]} material={rubber}><boxGeometry args={[b - a, .06, .025]} /></mesh>))}
  </group>;
}

function Chassis() {
  return <group>
    {[-1, 1].map(s => <mesh key={s} position={[.15, .36, s * .46]} material={darkMetal}><boxGeometry args={[5.7, .16, .08]} /></mesh>)}
    <mesh position={[RX, WR, 0]} rotation-x={Math.PI / 2} material={darkMetal}><cylinderGeometry args={[.05, .05, 2 * Z - .5, 12]} /></mesh>
    <mesh position={[RX, WR, 0]} material={darkMetal}><sphereGeometry args={[.14, 16, 12]} /></mesh>
    <mesh position={[FX, WR, 0]} rotation-x={Math.PI / 2} material={darkMetal}><cylinderGeometry args={[.045, .045, 2 * Z - .5, 12]} /></mesh>
    {[-1, 1].map(s => <mesh key={`sp${s}`} position={[RX, .5, s * .46]} material={darkMetal}><boxGeometry args={[1.1, .06, .09]} /></mesh>)}
    <mesh position={[.2, .33, 0]} rotation-z={Math.PI / 2} material={darkMetal}><cylinderGeometry args={[.04, .04, 3.4, 10]} /></mesh>
    <mesh position={[-.2, .36, -.72]} rotation-z={Math.PI / 2}><cylinderGeometry args={[.2, .2, .9, 20]} /><meshStandardMaterial color="#8b8b8b" metalness={.9} roughness={.25} /></mesh>
    <mesh position={[X0 - .02, .3, -.6]} rotation-z={Math.PI / 2} material={chrome}><cylinderGeometry args={[.05, .05, .2, 14]} /></mesh>
    {[-1, 1].map(s => <mesh key={`mf${s}`} position={[RX - .62, .32, s * (Z - .13)]} material={rubber}><boxGeometry args={[.025, .34, .34]} /></mesh>)}
  </group>;
}

function Rear() {
  const plate = useMemo(plateTexture, []);
  const rear = useMemo(rearTexture, []);
  return <group>
    <RearDoors x={X0} oz={Z - RC - .04} y0={Y0 + .12} y1={TOP - .06} open={false} map={rear} lining={LINING} />
    <Box p={[X0 - .09, .5, 0]} s={[.18, .22, 2.1]} c="#1a1718" m={.3} r={.5} radius={.04} />
    <Box p={[X0 - .16, .58, 0]} s={[.06, .02, 1.9]} c="#3a3638" radius={0} cast={false} />
    <mesh position={[X0 - .182, .5, 0]} rotation-y={-Math.PI / 2}><planeGeometry args={[.3, .15]} /><meshStandardMaterial map={plate} roughness={.4} /></mesh>
    {[-1, 1].map(s => <group key={s}>
      <mesh position={[X0 - .01, 1.35, s * (Z - .02)]} material={tailMat}><boxGeometry args={[.03, .36, .06]} /></mesh>
      <mesh position={[X0 - .01, 1.08, s * (Z - .02)]} material={signalMat}><boxGeometry args={[.03, .12, .06]} /></mesh>
      <mesh position={[X0 - .01, .92, s * (Z - .02)]} material={headMat}><boxGeometry args={[.03, .1, .06]} /></mesh>
      <mesh position={[X0 - .01, 2.84, s * .45]} material={tailMat}><boxGeometry args={[.03, .04, .09]} /></mesh>
    </group>)}
    <Box p={[X0 - .25, .45, 0]} s={[.18, .1, .14]} c="#1a1517" m={.6} r={.4} radius={.02} />
    <Cyl p={[X0 - .36, .5, 0]} r={.022} h={.12} c="#dcdcdc" m={1} rough={.15} />
    <Ball p={[X0 - .36, .58, 0]} r={.04} c="#dcdcdc" m={1} rough={.12} />
  </group>;
}

function Mirrors() {
  return <group>
    {[-1, 1].map(s => <group key={s} position={[XF - .05, 0, s * Z]}>
      {[1.72, 2.42].map(y => <mesh key={y} position={[0, y, s * .12]} rotation-x={Math.PI / 2} material={darkMetal}><cylinderGeometry args={[.014, .014, .26, 8]} /></mesh>)}
      <mesh position={[0, 2.07, s * .25]} material={darkMetal}><cylinderGeometry args={[.014, .014, .74, 8]} /></mesh>
      <RoundedBox args={[.08, .5, .2]} radius={.03} position={[.02, 2.07, s * .31]} castShadow><meshStandardMaterial color="#151314" roughness={.4} /></RoundedBox>
      <mesh position={[.065, 2.07, s * .31]} rotation-y={Math.PI / 2}><planeGeometry args={[.16, .44]} /><meshStandardMaterial color="#cfd8de" metalness={1} roughness={.05} /></mesh>
      <mesh position={[.03, 1.68, s * .3]}><sphereGeometry args={[.08, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#151314" roughness={.4} /></mesh>
    </group>)}
  </group>;
}

function Details() {
  return <group>
    {/* cab door seams, handle, grab bar, entry step */}
    {[-1, 1].map(s => <group key={s}>
      {[[1.42, 1.0, 2.5], [2.3, 1.36, 2.5]].map(([x, y0, y1]) => <mesh key={x} position={[x, (y0 + y1) / 2, s * (Z + .006)]} material={rubber}><boxGeometry args={[.01, y1 - y0, .004]} /></mesh>)}
      <mesh position={[1.86, 2.5, s * (Z + .006)]} material={rubber}><boxGeometry args={[.88, .01, .004]} /></mesh>
      <mesh position={[1.52, 1.52, s * (Z + .02)]} material={chrome}><boxGeometry args={[.06, .16, .03]} /></mesh>
      <mesh position={[1.39, 1.5, s * (Z + .05)]} material={chrome}><cylinderGeometry args={[.014, .014, .7, 8]} /></mesh>
      <mesh position={[1.62, .56, s * (Z - .12)]} material={darkMetal}><boxGeometry args={[.4, .04, .26]} /></mesh>
      {/* side markers */}
      <mesh position={[XF - .2, .98, s * (Z + .012)]} material={signalMat}><boxGeometry args={[.1, .04, .012]} /></mesh>
      <mesh position={[X0 + .2, .98, s * (Z + .012)]} material={tailMat}><boxGeometry args={[.1, .04, .012]} /></mesh>
      <mesh position={[.3, .98, s * (Z + .012)]} material={signalMat}><boxGeometry args={[.1, .04, .012]} /></mesh>
      {/* fuel door and vent louvres */}
      {s < 0 && <mesh position={[-.1, 1.05, -Z - .008]}><circleGeometry args={[.08, 20]} /><meshStandardMaterial color="#e9e3dc" roughness={.3} side={THREE.DoubleSide} /></mesh>}
      {[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[2.46, 1.02 + i * .05, s * (Z + .008)]} material={darkMetal}><boxGeometry args={[.1, .012, .006]} /></mesh>)}
    </group>)}
    {/* roof: air conditioner, vent, antenna */}
    <RoundedBox args={[1.1, .22, .82]} radius={.08} position={[-1.3, Y1 + .1, 0]} castShadow><meshPhysicalMaterial color={ivory} roughness={.25} clearcoat={1} /></RoundedBox>
    {[-.24, -.12, 0, .12, .24].map(z => <mesh key={z} position={[-1.3, Y1 + .215, z]} material={darkMetal}><boxGeometry args={[.8, .01, .05]} /></mesh>)}
    <RoundedBox args={[.5, .09, .42]} radius={.03} position={[.4, Y1 + .045, 0]}><meshPhysicalMaterial color={ivory} roughness={.25} clearcoat={1} /></RoundedBox>
  </group>;
}

/**
 * Reflection stand-in for the parts the mirrored ghost skips (interior, cab). Without it the reflection
 * is a hollow shell and slivers of the bright sky below the floor show through panel gaps, which
 * sparkle as the camera moves.
 */
const fillMat = new THREE.MeshStandardMaterial({ color: '#2a2426', roughness: .9 });
const roomMat = new THREE.MeshStandardMaterial({ color: LINING, roughness: .8 });
function GhostFill() {
  return <group>
    <mesh position={[(X0 + XF) / 2, (Y0 + FLOOR) / 2, 0]} material={fillMat}><boxGeometry args={[XF - X0 - .12, FLOOR - Y0 + .02, 2 * (Z - .6)]} /></mesh>
    <mesh position={[(X0 + X1) / 2, (FLOOR + 2.8) / 2, -.2]} material={roomMat}><boxGeometry args={[X1 - X0 - .14, 2.8 - FLOOR, 2 * Z - .56]} /></mesh>
    <mesh position={[(X1 + XF) / 2 - .02, (FLOOR + 2.8) / 2, 0]} material={fillMat}><boxGeometry args={[XF - X1 - .14, 2.8 - FLOOR, 2 * Z - .16]} /></mesh>
  </group>;
}

export function Van({ open, ghost = false }: { open: boolean; ghost?: boolean }) {
  const mobile = useThree(s => s.size.width < 900);
  const tex = useMemo(() => getLivery(mobile ? 'step-s' : 'step', { kind: 'van', width: mobile ? 1400 : 2560, height: mobile ? 591 : 1081, seed: 11, wordmarkY: 0, taglineY: 0, iconsY: 0, wordmarkSize: 0, showPhone: false }), [mobile]);
  return <group>
    <SideWalls plus={PLUS} minus={MINUS} z={Z} t={T} paint={paint} map={tex} />
    <Shell />
    <Glass />
    <Nose />
    <Mirrors />
    <Details />
    <Rear />
    <Chassis />
    <ServiceDoor open={open} tex={tex} />
    {[-1, 1].map(s => <group key={s}>
      <WheelWell x={RX} cy={WR} r={AR - .01} z0={s * (Z - .58)} z1={s * (Z - .005)} />
      <ArchCover xs={[RX]} cy={WR} r={AR} tr={WR} z={s * (Z - .05)} />
      <WheelWell x={FX} cy={WR} r={AR - .01} z0={s * (Z - .5)} z1={s * (Z - .005)} />
      <ArchCover xs={[FX]} cy={WR} r={AR} tr={WR} z={s * (Z - .05)} />
      <Wheel x={RX} y={WR} z={s * (Z - .14)} s={s as 1 | -1} R={WR} W={.22} rimK={.62} dual shadow={!ghost} />
      <Wheel x={FX} y={WR} z={s * (Z - .14)} s={s as 1 | -1} R={WR} W={.22} rimK={.62} dome shadow={!ghost} />
    </group>)}
    {ghost && <GhostFill />}
    {!ghost && <Interior mobile={mobile} />}
    {!ghost && <Cab />}
    {!ghost && <pointLight position={[-.3, .2, 0]} intensity={1.4} distance={4.5} color="#ffb98a" />}
    {!ghost && <FlashBeams />}
  </group>;
}
