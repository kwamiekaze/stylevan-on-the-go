import { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';
import { palette } from '@/config/brand';
import { Ball, Box, Cyl, type V3 } from './parts';
import { NightCtx, rng } from './theme';

function windowsTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d')!; g.fillStyle = '#000'; g.fillRect(0, 0, 256, 512);
  const r = rng(5);
  for (let y = 8; y < 512; y += 22) for (let x = 8; x < 256; x += 22) if (r() > .38) { g.fillStyle = r() > .7 ? '#ffd9a0' : r() > .4 ? '#ffb86b' : '#cfe0ff'; g.fillRect(x, y, 12, 14); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1); return t;
}

function Tree({ p, s = 1 }: { p: V3; s?: number }) {
  return <group position={p} scale={s}>
    <Cyl p={[0, 1.1, 0]} r={.14} h={2.2} c="#6a5648" rough={.9} />
    <Ball p={[0, 3.0, 0]} r={1.25} c="#5b8a5d" rough={.9} />
    <Ball p={[.7, 2.5, .3]} r={.9} c="#4f7b52" rough={.9} />
    <Ball p={[-.7, 2.7, -.2]} r={.95} c="#69946a" rough={.9} />
  </group>;
}

function Planter({ p }: { p: V3 }) {
  return <group position={p}>
    <Box p={[0, .3, 0]} s={[.9, .6, .9]} c={palette.cream} r={.4} radius={.05} />
    <Box p={[0, .62, 0]} s={[.95, .05, .95]} c={palette.gold} m={.85} r={.25} radius={.01} />
    {[[-.2, .8, -.1], [.15, .85, .15], [.2, .78, -.2], [-.15, .9, .2], [0, .95, 0]].map((q, i) => <Ball key={i} p={q as V3} r={.2} c={i % 2 ? '#f4b7c4' : '#ffd9de'} rough={.7} />)}
    <Ball p={[0, .7, 0]} r={.38} c="#587c5a" sy={.5} rough={.9} />
  </group>;
}

function Fountain({ p, water }: { p: V3; water: THREE.Material }) {
  return <group position={p}>
    <Cyl p={[0, .3, 0]} r={3.1} h={.6} c="#efe3d6" rough={.4} seg={48} />
    <Cyl p={[0, .62, 0]} r={3.2} h={.08} c={palette.gold} m={.9} rough={.25} seg={48} />
    <mesh position={[0, .58, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[2.9, 48]} /><primitive object={water} attach="material" /></mesh>
    <Cyl p={[0, 1.0, 0]} r={.22} h={1.2} c="#efe3d6" rough={.4} />
    <Cyl p={[0, 1.7, 0]} r={1.15} h={.14} c="#efe3d6" rough={.4} seg={32} />
    <Cyl p={[0, 1.66, 0]} r={1.2} h={.05} c={palette.gold} m={.9} rough={.25} seg={32} />
    <Cyl p={[0, 2.1, 0]} r={.12} h={.8} c="#efe3d6" rough={.4} />
    <Ball p={[0, 2.65, 0]} r={.28} c={palette.goldBright} m={.9} rough={.2} />
  </group>;
}

export function Estate({ reflective }: { reflective: boolean }) {
  const mix = useContext(NightCtx);
  const winTex = useMemo(windowsTexture, []);
  const windowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffe6bb', emissive: '#ffb867', emissiveIntensity: .2, roughness: .3, metalness: .1 }), []);
  const bulbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff2d6', emissive: '#ffc57a', emissiveIntensity: 1 }), []);
  const towerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b9a3b8', emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: .05, roughness: 1 }), [winTex]);
  const waterMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9fd0e8', emissive: '#4aa3d8', emissiveIntensity: .1, roughness: .05, metalness: .3, transparent: true, opacity: .9 }), []);
  const lampA = useRef<THREE.PointLight>(null), lampB = useRef<THREE.PointLight>(null);
  const dayT = useMemo(() => new THREE.Color('#c9b8d0'), []), nightT = useMemo(() => new THREE.Color('#2a2c55'), []);
  useFrame(() => {
    const m = mix.current;
    windowMat.emissiveIntensity = .2 + 1.5 * m; bulbMat.emissiveIntensity = .9 + 3.4 * m;
    towerMat.emissiveIntensity = .04 + 1.15 * m; towerMat.color.copy(dayT).lerp(nightT, m); waterMat.emissiveIntensity = .1 + .8 * m;
    if (lampA.current) lampA.current.intensity = 1.5 + 6 * m; if (lampB.current) lampB.current.intensity = 1.5 + 6 * m;
  });

  const skyline = useMemo(() => { const r = rng(9); return Array.from({ length: 56 }).map((_, i) => { const a = (i / 56) * Math.PI * 2; const rad = 66 + r() * 8; const h = 7 + r() * 24, w = 3 + r() * 4; return { p: [Math.cos(a) * rad, h / 2, Math.sin(a) * rad] as V3, s: [w, h, w] as V3, rot: -a }; }); }, []);
  const trees = useMemo(() => { const r = rng(15); const out: { p: V3; s: number }[] = []; for (let i = 0; i < 34; i++) { const a = r() * Math.PI * 2, rad = 26 + r() * 14; const x = Math.cos(a) * rad, z = Math.sin(a) * rad; if (z < 0 && Math.abs(x) < 20) continue; out.push({ p: [x, 0, z], s: .9 + r() * .7 }); } return out; }, []);
  const poles = useMemo(() => Array.from({ length: 12 }).map((_, i) => { const a = (i / 12) * Math.PI * 2 + .13; return new THREE.Vector3(Math.cos(a) * 17.5, 0, Math.sin(a) * 15 + 1.2); }), []);
  const bulbs = useMemo(() => { const pts: THREE.Vector3[] = []; poles.forEach((a, i) => { const b = poles[(i + 1) % poles.length]; for (let k = 1; k < 24; k++) { const t = k / 24; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t, 5.2 - 1.15 * 4 * t * (1 - t), a.z + (b.z - a.z) * t)); } }); return pts; }, [poles]);
  const inst = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { const m = inst.current; if (!m) return; const d = new THREE.Object3D(); bulbs.forEach((p, i) => { d.position.copy(p); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }); m.instanceMatrix.needsUpdate = true; }, [bulbs]);
  const wires = useMemo(() => poles.map((a, i) => { const b = poles[(i + 1) % poles.length]; const pts = Array.from({ length: 25 }).map((_, k) => { const t = k / 24; return new THREE.Vector3(a.x + (b.x - a.x) * t, 5.2 - 1.15 * 4 * t * (1 - t), a.z + (b.z - a.z) * t); }); return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#4a3d3a' })); }), [poles]);

  return <group>
    {/* lawn and plaza */}
    <mesh rotation-x={-Math.PI / 2} position={[0, -.02, 0]} receiveShadow><circleGeometry args={[110, 64]} /><meshStandardMaterial color="#8fb283" roughness={.95} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, -.005, 1.2]} receiveShadow><circleGeometry args={[19, 64]} /><meshStandardMaterial color="#cdbdac" roughness={.8} /></mesh>
    {reflective
      ? <mesh rotation-x={-Math.PI / 2} position={[0, .002, 1.2]} receiveShadow><planeGeometry args={[34, 12.5]} /><MeshReflectorMaterial blur={[260, 70]} resolution={512} mixBlur={1} mixStrength={1.0} roughness={.85} depthScale={.5} minDepthThreshold={.4} maxDepthThreshold={1.3} color="#d6c3b6" metalness={.25} mirror={0} /></mesh>
      : <mesh rotation-x={-Math.PI / 2} position={[0, .002, 1.2]} receiveShadow><planeGeometry args={[34, 12.5]} /><meshStandardMaterial color="#d9c5b8" roughness={.28} metalness={.2} /></mesh>}
    {[-12, -8, -4, 0, 4, 8, 12].map(x => <mesh key={x} rotation-x={-Math.PI / 2} position={[x, .006, 1.2]}><planeGeometry args={[.03, 12.5]} /><meshStandardMaterial color="#c2ae9b" roughness={.6} /></mesh>)}
    <mesh rotation-x={-Math.PI / 2} position={[0, .008, 6.6]}><planeGeometry args={[34, .06]} /><meshStandardMaterial color={palette.gold} metalness={.9} roughness={.25} /></mesh>
    {/* skyline ring */}
    {skyline.map((t, i) => <mesh key={i} position={t.p} rotation-y={t.rot} scale={t.s} material={towerMat}><boxGeometry args={[1, 1, 1]} /></mesh>)}
    {/* mansion */}
    <group position={[0, 0, -11]}>
      <Box p={[0, 3.2, 0]} s={[30, 6.4, 3]} c="#efe1d3" r={.8} radius={.03} />
      <Box p={[0, 6.7, 0]} s={[31.2, .5, 3.9]} c="#d6bb9d" r={.7} radius={.03} />
      <Box p={[0, 7.4, -.2]} s={[26, .9, 3]} c="#dcc3a6" r={.8} radius={.03} />
      {[-12, -8, -4, 0, 4, 8, 12].map(x => <group key={x}>
        <mesh position={[x, 3.3, 1.56]} material={windowMat}><boxGeometry args={[1.7, 4.4, .08]} /></mesh>
        <Box p={[x, 3.3, 1.62]} s={[.04, 4.4, .05]} c={palette.gold} m={.7} radius={0} cast={false} />
        <Box p={[x, 3.3, 1.62]} s={[1.7, .04, .05]} c={palette.gold} m={.7} radius={0} cast={false} />
        <Box p={[x - 1.85, 3.2, 1.7]} s={[.32, 5.6, .32]} c="#f6ede2" r={.5} radius={.03} />
      </group>)}
    </group>
    {Array.from({ length: 9 }).map((_, i) => <Box key={i} p={[-16 + i * 4, .7, -7.2]} s={[3.6, 1.4, 1.1]} c="#5e8a60" r={.95} radius={.4} />)}
    {trees.map((t, i) => <Tree key={i} p={t.p} s={t.s} />)}
    <Planter p={[-9.5, 0, 4.4]} /><Planter p={[9.6, 0, 4.4]} /><Planter p={[-6.4, 0, -3.9]} /><Planter p={[6.4, 0, -3.9]} />
    <Fountain p={[0, 0, 24]} water={waterMat} />
    {/* canopy of string lights */}
    {poles.map((p, i) => <group key={i} position={[p.x, 0, p.z]}>
      <Cyl p={[0, 2.65, 0]} r={.06} h={5.3} c="#3a3033" rough={.5} m={.4} />
      <mesh position={[0, 5.32, 0]} material={bulbMat}><sphereGeometry args={[.13, 12, 8]} /></mesh>
    </group>)}
    {wires.map((w, i) => <primitive key={i} object={w} />)}
    <instancedMesh ref={inst} args={[undefined, undefined, bulbs.length]} material={bulbMat}><sphereGeometry args={[.09, 8, 6]} /></instancedMesh>
    <pointLight ref={lampA} position={[-8, 3, -3]} intensity={2} distance={14} color="#ffc98f" />
    <pointLight ref={lampB} position={[8, 3, -3]} intensity={2} distance={14} color="#ffc98f" />
  </group>;
}
