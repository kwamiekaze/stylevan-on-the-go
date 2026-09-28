import { useMemo } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';
import { palette } from '@/config/brand';
import { Ball, Box, Cyl, type V3 } from './parts';

function Sky() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#6f6394') }, mid: { value: new THREE.Color('#e8a0a0') }, low: { value: new THREE.Color('#ffdcb2') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 low; void main(){ float h = clamp(vP.y,0.0,1.0); vec3 c = mix(low, mid, smoothstep(0.0,0.28,h)); c = mix(c, top, smoothstep(0.22,0.85,h)); gl_FragColor = vec4(c,1.0); }',
  }), []);
  return <group>
    <mesh material={material} scale={90}><sphereGeometry args={[1, 32, 20]} /></mesh>
    <mesh position={[-22, 9, -60]}><circleGeometry args={[6.5, 40]} /><meshBasicMaterial color="#fff0cf" fog={false} transparent opacity={.9} /></mesh>
    <mesh position={[-22, 9, -59.5]}><circleGeometry args={[14, 40]} /><meshBasicMaterial color="#ffd7b0" fog={false} transparent opacity={.28} /></mesh>
  </group>;
}

function Skyline() {
  const towers = useMemo(() => Array.from({ length: 22 }).map((_, i) => {
    const h = 5 + ((i * 53) % 17), w = 2 + ((i * 29) % 4);
    return { x: -38 + i * 3.6, h, w };
  }), []);
  return <group position={[0, 0, -46]}>
    {towers.map((t, i) => <mesh key={i} position={[t.x, t.h / 2, 0]}><boxGeometry args={[t.w, t.h, 2]} /><meshStandardMaterial color="#9a7d92" emissive="#ffb98a" emissiveIntensity={.18} roughness={1} /></mesh>)}
  </group>;
}

function Tree({ p, s = 1 }: { p: V3; s?: number }) {
  return <group position={p} scale={s}>
    <Cyl p={[0, 1.1, 0]} r={.14} h={2.2} c="#6a5648" rough={.9} />
    <Ball p={[0, 3.0, 0]} r={1.25} c="#5b7d5b" rough={.9} />
    <Ball p={[.7, 2.5, .3]} r={.9} c="#4f7050" rough={.9} />
    <Ball p={[-.7, 2.7, -.2]} r={.95} c="#628460" rough={.9} />
  </group>;
}

function StringLights({ a, b, sag = .9, n = 26, y = 5 }: { a: V3; b: V3; sag?: number; n?: number; y?: number }) {
  const pts = useMemo(() => Array.from({ length: n + 1 }).map((_, i) => {
    const t = i / n;
    return new THREE.Vector3(a[0] + (b[0] - a[0]) * t, y - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t);
  }), [a, b, n, sag, y]);
  const line = useMemo(() => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#4a3d3a' })), [pts]);
  return <group>
    <primitive object={line} />
    {pts.map((p, i) => <mesh key={i} position={p}><sphereGeometry args={[.085, 8, 6]} /><meshStandardMaterial color="#fff2d6" emissive="#ffc57a" emissiveIntensity={3} /></mesh>)}
  </group>;
}

function Pole({ p }: { p: V3 }) {
  return <group position={p}>
    <Cyl p={[0, 2.6, 0]} r={.06} h={5.2} c="#3a3033" rough={.5} m={.4} />
    <Ball p={[0, 5.25, 0]} r={.12} c="#ffe1b0" e="#ffc27a" ei={2} />
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

export function Estate({ reflective }: { reflective: boolean }) {
  return <group>
    <Sky />
    <Skyline />
    {/* ground */}
    <mesh rotation-x={-Math.PI / 2} position={[0, -.02, 0]} receiveShadow><planeGeometry args={[140, 140]} /><meshStandardMaterial color="#cbb8a8" roughness={.8} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -8.5]} receiveShadow><planeGeometry args={[60, 5]} /><meshStandardMaterial color="#b6c19f" roughness={.95} /></mesh>
    {reflective
      ? <mesh rotation-x={-Math.PI / 2} position={[0, .002, 1.2]} receiveShadow><planeGeometry args={[34, 12.5]} /><MeshReflectorMaterial blur={[260, 70]} resolution={512} mixBlur={1} mixStrength={1.1} roughness={.85} depthScale={.5} minDepthThreshold={.4} maxDepthThreshold={1.3} color="#d6c3b6" metalness={.25} mirror={0} /></mesh>
      : <mesh rotation-x={-Math.PI / 2} position={[0, .002, 1.2]} receiveShadow><planeGeometry args={[34, 12.5]} /><meshStandardMaterial color="#d9c5b8" roughness={.28} metalness={.2} /></mesh>}
    {/* paver seams and gold inlay */}
    {[-12, -8, -4, 0, 4, 8, 12].map(x => <mesh key={x} rotation-x={-Math.PI / 2} position={[x, .006, 1.2]}><planeGeometry args={[.03, 12.5]} /><meshStandardMaterial color="#cdbca9" roughness={.6} /></mesh>)}
    <mesh rotation-x={-Math.PI / 2} position={[0, .008, 6.6]}><planeGeometry args={[34, .06]} /><meshStandardMaterial color={palette.gold} metalness={.9} roughness={.25} /></mesh>
    {/* mansion */}
    <group position={[0, 0, -11]}>
      <Box p={[0, 3.2, 0]} s={[30, 6.4, 3]} c="#e8d8ca" r={.8} radius={.03} />
      <Box p={[0, 6.7, 0]} s={[31.2, .5, 3.9]} c="#d6bb9d" r={.7} radius={.03} />
      <Box p={[0, 7.4, -.2]} s={[26, .9, 3]} c="#dcc3a6" r={.8} radius={.03} />
      {[-12, -8, -4, 0, 4, 8, 12].map(x => <group key={x}>
        <Box p={[x, 3.3, 1.56]} s={[1.7, 4.4, .08]} c="#ffd7a0" e="#ffb867" ei={1.15} radius={0} cast={false} />
        <Box p={[x, 3.3, 1.62]} s={[.04, 4.4, .05]} c={palette.gold} m={.7} radius={0} cast={false} />
        <Box p={[x, 3.3, 1.62]} s={[1.7, .04, .05]} c={palette.gold} m={.7} radius={0} cast={false} />
        <Box p={[x - 1.85, 3.2, 1.7]} s={[.32, 5.6, .32]} c="#f1e6d9" r={.5} radius={.03} />
      </group>)}
      {[-11, 11].map(x => <Box key={x} p={[x, 1.1, 2.1]} s={[.9, 2.2, .9]} c="#e8d8ca" r={.7} radius={.03} />)}
    </group>
    {/* hedge line */}
    {Array.from({ length: 9 }).map((_, i) => <Box key={i} p={[-16 + i * 4, .7, -7.2]} s={[3.6, 1.4, 1.1]} c="#587c5a" r={.95} radius={.4} />)}
    <Tree p={[-15, 0, -6]} s={1.15} /><Tree p={[15.5, 0, -6.5]} s={1.25} /><Tree p={[-22, 0, -3]} s={1.3} /><Tree p={[23, 0, -2]} s={1.2} />
    <Planter p={[-9.5, 0, 4.4]} /><Planter p={[9.6, 0, 4.4]} /><Planter p={[-6.4, 0, -3.9]} /><Planter p={[6.4, 0, -3.9]} />
    {/* string lights and poles */}
    {[-14, -5, 5, 14].map(x => <Pole key={`b${x}`} p={[x, 0, -4.3]} />)}
    {[-14, 14].map(x => <Pole key={`f${x}`} p={[x, 0, 6.5]} />)}
    <StringLights a={[-14, 5.2, -4.3]} b={[-5, 5.2, -4.3]} /><StringLights a={[-5, 5.2, -4.3]} b={[5, 5.2, -4.3]} sag={1.1} n={30} />
    <StringLights a={[5, 5.2, -4.3]} b={[14, 5.2, -4.3]} /><StringLights a={[-14, 5.2, 6.5]} b={[14, 5.2, 6.5]} sag={1.6} n={44} />
    {/* warm accent lights on the driveway */}
    <pointLight position={[-8, 3, -3]} intensity={5} distance={14} color="#ffc98f" />
    <pointLight position={[8, 3, -3]} intensity={5} distance={14} color="#ffc98f" />
  </group>;
}
