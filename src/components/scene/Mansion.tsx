import { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NightCtx, rng } from './theme';
import { palette } from '@/config/brand';

function limestone() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d')!; const r = rng(41);
  g.fillStyle = '#eadfce'; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) for (let col = -1; col < 4; col++) {
    const x = col * 128 + (row % 2) * 64, y = row * 64; const v = (r() - .5) * 16;
    g.fillStyle = `rgb(${234 + v},${223 + v},${206 + v})`; g.fillRect(x + 1.5, y + 1.5, 125, 61);
  }
  g.strokeStyle = 'rgba(150,132,110,.55)'; g.lineWidth = 3;
  for (let row = 0; row <= 8; row++) { g.beginPath(); g.moveTo(0, row * 64); g.lineTo(512, row * 64); g.stroke(); }
  for (let row = 0; row < 8; row++) for (let col = -1; col < 5; col++) { const x = col * 128 + (row % 2) * 64; g.beginPath(); g.moveTo(x, row * 64); g.lineTo(x, row * 64 + 64); g.stroke(); }
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() > .5 ? '120,100,80' : '255,250,240'},.09)`; g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2 + r() * 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

function Wall({ p, s, mat }: { p: [number, number, number]; s: [number, number, number]; mat: THREE.Material }) {
  return <mesh position={p} castShadow receiveShadow material={mat}><boxGeometry args={s} /></mesh>;
}

export function Mansion({ position, mobile }: { position: [number, number, number]; mobile: boolean }) {
  const mix = useContext(NightCtx);
  const base = useMemo(limestone, []);
  const walls = useMemo(() => { const mk = (rx: number, ry: number) => { const t = base.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: .6, roughness: .85, color: '#f3e9db' }); }; return { main: mk(4, 1.7), wing: mk(3, 1.5), col: mk(1, 2), trim: new THREE.MeshStandardMaterial({ color: '#f7f0e6', roughness: .55 }) }; }, [base]);
  const roof = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5a5768', roughness: .55, metalness: .15 }), []);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffe3b4', emissive: '#ffb45e', emissiveIntensity: .2, roughness: .12, metalness: .2 }), []);
  const door = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d2a2c', roughness: .4, metalness: .1 }), []);
  const goldM = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.goldBright, roughness: .25, metalness: 1 }), []);
  const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff0d0', emissive: '#ffbf70', emissiveIntensity: 1 }), []);
  const posts = useRef<THREE.InstancedMesh>(null);
  useFrame(() => { const m = mix.current; glass.emissiveIntensity = .18 + 1.7 * m; lamp.emissiveIntensity = 1 + 3 * m; });
  const postList = useMemo(() => { const out: [number, number, number][] = []; const row = (x0: number, x1: number, y: number, z: number) => { for (let x = x0; x <= x1; x += .55) out.push([x, y, z]); }; row(-19, -8.2, 6.25, 1.6); row(8.2, 19, 6.25, 1.6); row(-8, 8, 7.9, 2.1); return out; }, []);
  useLayoutEffect(() => { const m = posts.current; if (!m) return; const d = new THREE.Object3D(); postList.forEach((p, i) => { d.position.set(...p); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }); m.instanceMatrix.needsUpdate = true; }, [postList]);

  const Win = ({ x, y, w = 1.35, h = 2.5, z }: { x: number; y: number; w?: number; h?: number; z: number }) => <group position={[x, y, z]}>
    <mesh position={[0, 0, .02]} material={glass}><boxGeometry args={[w, h, .06]} /></mesh>
    <mesh position={[0, 0, .07]} material={walls.trim}><boxGeometry args={[.06, h, .05]} /></mesh>
    <mesh position={[0, .1, .07]} material={walls.trim}><boxGeometry args={[w, .06, .05]} /></mesh>
    {[[-w / 2 - .09, 0], [w / 2 + .09, 0]].map(([dx], i) => <mesh key={i} position={[dx, 0, .05]} material={walls.trim}><boxGeometry args={[.18, h + .3, .12]} /></mesh>)}
    <mesh position={[0, h / 2 + .2, .06]} material={walls.trim}><boxGeometry args={[w + .6, .22, .16]} /></mesh>
    <mesh position={[0, -h / 2 - .1, .1]} material={walls.trim}><boxGeometry args={[w + .5, .12, .26]} /></mesh>
  </group>;

  const pediment = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-4.9, 0); sh.lineTo(4.9, 0); sh.lineTo(0, 1.75); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: false }); g.translate(0, 0, -.7); return g; }, []);
  const cols = [-3.6, -1.2, 1.2, 3.6];
  const wingWin = mobile ? [-15.5, -12.2] : [-16.6, -14, -11.4];
  return <group position={position}>
    {/* plinth and wings */}
    <Wall p={[0, .35, .5]} s={[39, .7, 4.6]} mat={walls.trim} />
    <Wall p={[0, 3.7, 0]} s={[17, 6.6, 4.2]} mat={walls.main} />
    <Wall p={[-13.5, 3, -.3]} s={[12, 5.2, 3.6]} mat={walls.wing} />
    <Wall p={[13.5, 3, -.3]} s={[12, 5.2, 3.6]} mat={walls.wing} />
    {/* cornices */}
    <Wall p={[0, 7.05, .3]} s={[18, .5, 5.0]} mat={walls.trim} />
    {[-13.5, 13.5].map(x => <Wall key={x} p={[x, 5.45, .1]} s={[12.8, .4, 4.3]} mat={walls.trim} />)}
    {/* hip roofs */}
    <mesh position={[0, 9.0, 0]} rotation-y={Math.PI / 4} scale={[8.6, 3.4, 5.2]} material={roof} castShadow><coneGeometry args={[1, 1, 4]} /></mesh>
    {[-13.5, 13.5].map(x => <mesh key={x} position={[x, 7.0, -.3]} rotation-y={Math.PI / 4} scale={[6.6, 2.6, 4.4]} material={roof} castShadow><coneGeometry args={[1, 1, 4]} /></mesh>)}
    {[-4.8, 4.2, -17.6, 17].map(x => <Wall key={x} p={[x, 8.6, -.4]} s={[.9, 2.4, .9]} mat={walls.main} />)}
    {/* balustrade */}
    <instancedMesh ref={posts} args={[undefined, undefined, postList.length]} material={walls.trim}><cylinderGeometry args={[.09, .11, .8, 8]} /></instancedMesh>
    <Wall p={[-13.5, 6.7, 1.6]} s={[11.2, .12, .25]} mat={walls.trim} />
    <Wall p={[13.5, 6.7, 1.6]} s={[11.2, .12, .25]} mat={walls.trim} />
    <Wall p={[0, 8.35, 2.1]} s={[16.4, .12, .25]} mat={walls.trim} />
    {/* portico */}
    <Wall p={[0, .18, 4.6]} s={[9.6, .36, 2.4]} mat={walls.trim} />
    <Wall p={[0, .54, 4.3]} s={[9.1, .36, 2.0]} mat={walls.trim} />
    <Wall p={[0, .9, 4.0]} s={[8.6, .36, 1.6]} mat={walls.trim} />
    {cols.map(x => <group key={x} position={[x, 0, 4.1]}>
      <mesh position={[0, 1.1, 0]} material={walls.trim}><boxGeometry args={[.95, .3, .95]} /></mesh>
      <mesh position={[0, 3.6, 0]} material={walls.col} castShadow><cylinderGeometry args={[.36, .42, 5.0, 20]} /></mesh>
      <mesh position={[0, 6.2, 0]} material={walls.trim}><boxGeometry args={[.98, .32, .98]} /></mesh>
      <mesh position={[0, 6.0, 0]} material={goldM}><cylinderGeometry args={[.42, .38, .1, 20]} /></mesh>
    </group>)}
    <Wall p={[0, 6.6, 4.1]} s={[9.6, .55, 1.4]} mat={walls.trim} />
    
    <mesh geometry={pediment} position={[0, 6.87, 4.1]} material={walls.trim} castShadow />
    <mesh position={[0, 7.4, 4.86]} material={glass}><circleGeometry args={[.42, 24]} /></mesh>
    {/* grand door */}
    <mesh position={[0, 2.5, 2.16]} material={door}><boxGeometry args={[2.6, 3.9, .12]} /></mesh>
    <mesh position={[0, 4.75, 2.17]} material={glass}><boxGeometry args={[2.6, .9, .12]} /></mesh>
    <mesh position={[0, 2.5, 2.24]} material={goldM}><boxGeometry args={[.05, 3.8, .04]} /></mesh>
    {[-.3, .3].map(x => <mesh key={x} position={[x, 2.4, 2.27]} material={goldM}><sphereGeometry args={[.07, 10, 8]} /></mesh>)}
    {[-1.9, 1.9].map(x => <mesh key={x} position={[x, 3.4, 2.3]} material={lamp}><boxGeometry args={[.22, .5, .22]} /></mesh>)}
    {/* windows */}
    {[-6.4, -4.6, 4.6, 6.4].map(x => <Win key={x} x={x} y={2.9} z={2.13} />)}
    {[-6.5, -3.2, 0, 3.2, 6.5].map(x => <Win key={x} x={x} y={5.6} z={2.13} w={1.2} h={1.5} />)}
    {[...wingWin, ...wingWin.map(x => -x)].map((x, i) => <group key={i}><Win x={x + (x > 0 ? 0 : 0)} y={2.7} z={1.55 - .3 + .28} /><Win x={x} y={4.6} z={1.55 - .3 + .28} w={1.2} h={1.1} /></group>)}
  </group>;
}
