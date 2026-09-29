import { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';
import { palette } from '@/config/brand';
import { NightCtx, rng } from './theme';
import { Fountain } from './Fountain';
import { Mansion } from './Mansion';
import { Blooms, Grass, Trees, lawnTexture } from './Grounds';

function windowsTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d')!; g.fillStyle = '#000'; g.fillRect(0, 0, 256, 512);
  const r = rng(5);
  for (let y = 8; y < 512; y += 22) for (let x = 8; x < 256; x += 22) if (r() > .38) { g.fillStyle = r() > .7 ? '#ffd9a0' : r() > .4 ? '#ffb86b' : '#cfe0ff'; g.fillRect(x, y, 12, 14); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

const PLAZA = { x: 34, z: 12.7, cz: 1.2 };

export function Estate({ reflective, mobile }: { reflective: boolean; mobile: boolean }) {
  const skip = typeof window === 'undefined' ? [] : (new URLSearchParams(window.location.search).get('skip') ?? '').split(',');
  const mix = useContext(NightCtx);
  const winTex = useMemo(windowsTexture, []);
  const lawnTex = useMemo(() => { const t = lawnTexture(); t.repeat.set(1 / 8, 1 / 8); return t; }, []);
  const bulbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff2d6', emissive: '#ffc57a', emissiveIntensity: 1 }), []);
  const towerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b9a3b8', emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: .05, roughness: 1 }), [winTex]);
  const lampA = useRef<THREE.PointLight>(null), lampB = useRef<THREE.PointLight>(null);
  const dayT = useMemo(() => new THREE.Color('#c9b8d0'), []), nightT = useMemo(() => new THREE.Color('#2a2c55'), []);
  useFrame(() => {
    const m = mix.current;
    bulbMat.emissiveIntensity = .9 + 3.4 * m; towerMat.emissiveIntensity = .04 + 1.15 * m; towerMat.color.copy(dayT).lerp(nightT, m);
    if (lampA.current) lampA.current.intensity = 1.5 + 6 * m; if (lampB.current) lampB.current.intensity = 1.5 + 6 * m;
  });

  const lawnGeo = useMemo(() => {
    const s = new THREE.Shape(); s.absarc(0, 0, 118, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); const x = PLAZA.x / 2, z0 = PLAZA.cz - PLAZA.z / 2, z1 = PLAZA.cz + PLAZA.z / 2;
    hole.moveTo(-x, -z1); hole.lineTo(x, -z1); hole.lineTo(x, -z0); hole.lineTo(-x, -z0); hole.closePath(); s.holes.push(hole);
    return new THREE.ShapeGeometry(s, 40);
  }, []);
  const skyline = useMemo(() => { const r = rng(9); return Array.from({ length: 56 }).map((_, i) => { const a = (i / 56) * Math.PI * 2; const rad = 68 + r() * 8; const h = 7 + r() * 24, w = 3 + r() * 4; return { p: [Math.cos(a) * rad, h / 2, Math.sin(a) * rad] as [number, number, number], s: [w, h, w] as [number, number, number], rot: -a }; }); }, []);
  const trees = useMemo(() => {
    const r = rng(15); const out: { x: number; z: number; s: number; kind: 'oak' | 'cypress' | 'blossom' }[] = [];
    const want = mobile ? 24 : 40;
    for (let i = 0; out.length < want && i < 400; i++) {
      const a = r() * Math.PI * 2, rad = 26 + r() * 18, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      if (z < 0 && Math.abs(x) < 24) continue; if (Math.hypot(x, z - 24) < 10) continue;
      const k = r(); out.push({ x, z, s: .85 + r() * .7, kind: k < .16 ? 'cypress' : k < .34 ? 'blossom' : 'oak' });
    }
    [[-21, 4], [21, 4], [-20, 15], [20, 15]].forEach(([x, z], i) => out.push({ x, z, s: 1.05, kind: i % 2 ? 'blossom' : 'oak' }));
    return out;
  }, [mobile]);
  const spots = useMemo(() => {
    const out: { x: number; z: number; r: number; n: number; kind: 'flower' | 'bush' }[] = [];
    for (let x = -19; x <= 19; x += 1.6) { if (Math.abs(x) < 3.2) continue; out.push({ x, z: -6.5, r: .35, n: 2, kind: 'bush' }); }
    for (let x = -19; x <= 19; x += 1.5) { if (Math.abs(x) < 5.5) continue; out.push({ x, z: -11.4, r: .8, n: mobile ? 8 : 16, kind: 'flower' }); out.push({ x, z: -11.9, r: .55, n: 1, kind: 'bush' }); }
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; out.push({ x: Math.cos(a) * 5.6, z: 24 + Math.sin(a) * 5.6, r: .6, n: mobile ? 8 : 14, kind: 'flower' }); }
    return out;
  }, [mobile]);
  const poles = useMemo(() => Array.from({ length: 14 }).map((_, i) => { const a = (i / 14) * Math.PI * 2 + .11; return new THREE.Vector3(Math.cos(a) * 17.8, 0, 7 + Math.sin(a) * 11.6); }), []);
  const curve = (a: THREE.Vector3, b: THREE.Vector3, t: number) => new THREE.Vector3(a.x + (b.x - a.x) * t, 5.2 - 1.05 * 4 * t * (1 - t), a.z + (b.z - a.z) * t);
  const bulbs = useMemo(() => { const pts: THREE.Vector3[] = []; poles.forEach((a, i) => { const b = poles[(i + 1) % poles.length]; for (let k = 1; k < 22; k++) pts.push(curve(a, b, k / 22)); }); return pts; }, [poles]);
  const wires = useMemo(() => poles.map((a, i) => { const b = poles[(i + 1) % poles.length]; const pts = Array.from({ length: 23 }).map((_, k) => curve(a, b, k / 22)); return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#3d3336' })); }), [poles]);
  const inst = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { const m = inst.current; if (!m) return; const d = new THREE.Object3D(); bulbs.forEach((p, i) => { d.position.copy(p); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }); m.instanceMatrix.needsUpdate = true; }, [bulbs]);
  const stonePath = '#d9cbb9';

  return <group>
    {/* ground */}
    <mesh geometry={lawnGeo} rotation-x={-Math.PI / 2} position={[0, -.02, 0]} receiveShadow><meshStandardMaterial map={lawnTex} roughness={.95} /></mesh>
    <mesh position={[0, -3.4, PLAZA.cz]} rotation-x={-Math.PI / 2}><planeGeometry args={[PLAZA.x + 2, PLAZA.z + 2]} /><meshBasicMaterial color="#120d12" /></mesh>
    {reflective
      ? <mesh rotation-x={-Math.PI / 2} position={[0, .002, PLAZA.cz]} receiveShadow><planeGeometry args={[PLAZA.x, PLAZA.z]} /><MeshReflectorMaterial blur={[70, 18]} resolution={768} mixBlur={.9} mixStrength={26} roughness={.5} depthScale={.7} minDepthThreshold={.5} maxDepthThreshold={1.6} color="#1d171b" metalness={.55} mirror={0} /></mesh>
      : <mesh rotation-x={-Math.PI / 2} position={[0, .002, PLAZA.cz]} receiveShadow renderOrder={1}><planeGeometry args={[PLAZA.x, PLAZA.z]} /><meshStandardMaterial color="#1d171b" roughness={.18} metalness={.5} transparent opacity={.62} /></mesh>}
    {[-1, 1].map(s => <mesh key={s} position={[0, .012, PLAZA.cz + s * (PLAZA.z / 2 - .12)]} rotation-x={-Math.PI / 2}><planeGeometry args={[PLAZA.x, .07]} /><meshStandardMaterial color={palette.gold} metalness={1} roughness={.25} /></mesh>)}
    {[-1, 1].map(s => <mesh key={s} position={[s * (PLAZA.x / 2 - .12), .012, PLAZA.cz]} rotation-x={-Math.PI / 2}><planeGeometry args={[.07, PLAZA.z]} /><meshStandardMaterial color={palette.gold} metalness={1} roughness={.25} /></mesh>)}
    {[-1, 1].map(s => <mesh key={s} position={[0, .05, PLAZA.cz + s * (PLAZA.z / 2 + .18)]} receiveShadow><boxGeometry args={[PLAZA.x + .8, .1, .36]} /><meshStandardMaterial color="#efe4d6" roughness={.5} /></mesh>)}
    {[-1, 1].map(s => <mesh key={s} position={[s * (PLAZA.x / 2 + .18), .05, PLAZA.cz]} receiveShadow><boxGeometry args={[.36, .1, PLAZA.z + .8]} /><meshStandardMaterial color="#efe4d6" roughness={.5} /></mesh>)}
    {/* path to the mansion and to the fountain, fountain court */}
    <mesh rotation-x={-Math.PI / 2} position={[0, .004, -6.9]}><planeGeometry args={[4.6, 3.6]} /><meshStandardMaterial color={stonePath} roughness={.6} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, .004, 13]}><planeGeometry args={[4.6, 10.8]} /><meshStandardMaterial color={stonePath} roughness={.6} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, .006, 24]}><circleGeometry args={[6.6, 64]} /><meshStandardMaterial color={stonePath} roughness={.6} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, .012, 24]}><ringGeometry args={[6.35, 6.5, 64]} /><meshStandardMaterial color={palette.gold} metalness={1} roughness={.25} /></mesh>
    {[-2.6, 2.6].flatMap(x => [9.5, 12.5, 15.5].map(z => <mesh key={`${x}${z}`} position={[x, .45, z]} material={bulbMat}><cylinderGeometry args={[.12, .14, .9, 10]} /></mesh>))}
    {/* skyline ring */}
    {skyline.map((t, i) => <mesh key={i} position={t.p} rotation-y={t.rot} scale={t.s} material={towerMat}><boxGeometry args={[1, 1, 1]} /></mesh>)}
    {!skip.includes('mansion') && <Mansion position={[0, 0, -14]} mobile={mobile} />}
    {!skip.includes('fountain') && <Fountain position={[0, 0, 24]} mobile={mobile} />}
    {!skip.includes('grass') && <Grass count={mobile ? 9000 : 30000} />}
    {!skip.includes('trees') && <Trees list={trees} clumps={mobile ? 24 : 44} />}
    {!skip.includes('blooms') && <Blooms spots={spots} />}
    {/* string light canopy: an oval that stays in front of the mansion */}
    {poles.map((p, i) => <group key={i} position={[p.x, 0, p.z]}>
      <mesh position={[0, 2.65, 0]} castShadow><cylinderGeometry args={[.06, .08, 5.3, 8]} /><meshStandardMaterial color="#3a3033" roughness={.5} metalness={.4} /></mesh>
      <mesh position={[0, 5.32, 0]} material={bulbMat}><sphereGeometry args={[.13, 12, 8]} /></mesh>
    </group>)}
    {wires.map((w, i) => <primitive key={i} object={w} />)}
    <instancedMesh ref={inst} args={[undefined, undefined, bulbs.length]} material={bulbMat}><sphereGeometry args={[.09, 8, 6]} /></instancedMesh>
    <pointLight ref={lampA} position={[-8, 3, -3]} intensity={2} distance={14} color="#ffc98f" />
    <pointLight ref={lampB} position={[8, 3, -3]} intensity={2} distance={14} color="#ffc98f" />
  </group>;
}
