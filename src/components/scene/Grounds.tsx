import { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NightCtx, rng } from './theme';

/** Mown lawn texture with alternating stripes and blade level noise. */
export function lawnTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d')!; const r = rng(31);
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#5d8a4a' : '#6b9954'; g.fillRect(0, i * 64, 1024, 64); }
  const img = g.getImageData(0, 0, 1024, 1024); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 26; d[i] += n * .7; d[i + 1] += n; d[i + 2] += n * .6; }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${r() > .5 ? '150,190,90' : '40,80,40'},.25)`; g.fillRect(r() * 1024, r() * 1024, 2, 3 + r() * 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

/** Thousands of swaying blades in one draw call. */
export function Grass({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const time = useMemo(() => ({ value: 0 }), []);
  const geo = useMemo(() => {
    const w = .022, v = [-w, 0, 0, w, 0, 0, -w * .7, .5, 0, w * .7, .5, 0, 0, 1, 0];
    const col: number[] = []; [0, 0, .5, .5, 1].forEach(h => { const a = .35 + h * .65; col.push(.16 * a + .05, .34 * a + .08, .1 * a + .03); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); g.computeVertexNormals(); return g;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .9 });
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = time;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 wp = vec3(instanceMatrix[3].x, 0.0, instanceMatrix[3].z);
        float sw = sin(uTime * 1.5 + wp.x * .4 + wp.z * .27) * .55 + sin(uTime * 2.4 + wp.z * .8 + wp.x * .2) * .25;
        transformed.x += sw * position.y * position.y * .55; transformed.z += sw * position.y * position.y * .25;`);
    };
    return m;
  }, [time]);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return; const r = rng(77); const d = new THREE.Object3D(); const c = new THREE.Color(); let n = 0;
    while (n < count) {
      const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * 44, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      if (Math.abs(x) < 18.6 && z > -5.6 && z < 8.1) continue;          // plaza
      if (z < -7 && Math.abs(x) < 23) continue;                            // mansion and beds
      if (Math.hypot(x, z - 24) < 7.4) continue;                          // fountain court
      if (Math.abs(x) < 2.6 && z > 8 && z < 18) continue;                  // path
      d.position.set(x, 0, z); d.rotation.set((r() - .5) * .35, r() * Math.PI * 2, (r() - .5) * .35);
      const h = .38 + r() * .5; d.scale.set(1 + r() * .8, h, 1); d.updateMatrix(); m.setMatrixAt(n, d.matrix);
      c.setHSL(.24 + r() * .06, .5 + r() * .2, .78 + r() * .5); m.setColorAt(n, c); n++;
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count]);
  useFrame(({ clock }) => { time.value = clock.elapsedTime; });
  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} receiveShadow />;
}

/** Instanced foliage: round oaks, tall cypress and pink blossom trees. */
export function Trees({ list, clumps }: { list: { x: number; z: number; s: number; kind: 'oak' | 'cypress' | 'blossom' }[]; clumps: number }) {
  const foliage = useRef<THREE.InstancedMesh>(null), trunks = useRef<THREE.InstancedMesh>(null);
  const total = list.reduce((a, t) => a + (t.kind === 'cypress' ? Math.ceil(clumps * .6) : clumps), 0);
  useLayoutEffect(() => {
    const f = foliage.current, tr = trunks.current; if (!f || !tr) return;
    const r = rng(99), d = new THREE.Object3D(), c = new THREE.Color(); let n = 0;
    list.forEach((t, ti) => {
      const th = t.kind === 'cypress' ? 1.2 : 2.3 * t.s;
      d.position.set(t.x, th / 2, t.z); d.rotation.set(0, 0, 0); d.scale.set(.16 * t.s + .05, th, .16 * t.s + .05); d.updateMatrix(); tr.setMatrixAt(ti, d.matrix);
      const cnt = t.kind === 'cypress' ? Math.ceil(clumps * .6) : clumps;
      for (let i = 0; i < cnt; i++) {
        let px: number, py: number, pz: number, rad: number;
        if (t.kind === 'cypress') { const u = i / cnt; py = th + u * 4.6 * t.s; const w = (1 - u * .85) * .75 * t.s; const a = r() * 6.28; px = Math.cos(a) * w * r(); pz = Math.sin(a) * w * r(); rad = (.55 + r() * .35) * t.s * (1 - u * .5); }
        else { const a = r() * 6.28, b = Math.acos(2 * r() - 1), q = Math.cbrt(r()); px = Math.sin(b) * Math.cos(a) * 2.1 * q * t.s; py = th + 1.5 * t.s + Math.cos(b) * 1.6 * q * t.s; pz = Math.sin(b) * Math.sin(a) * 2.1 * q * t.s; rad = (.75 + r() * .6) * t.s; }
        d.position.set(t.x + px, py, t.z + pz); d.rotation.set(r() * 3, r() * 3, r() * 3); d.scale.set(rad, rad * .85, rad); d.updateMatrix(); f.setMatrixAt(n, d.matrix);
        const hi = (py - th) / (4 * t.s) + r() * .25;
        if (t.kind === 'blossom') c.set(['#f7b8c9', '#ffd3df', '#f29ab4', '#fff0f4'][Math.floor(r() * 4)]).offsetHSL(0, 0, (hi - .3) * .08);
        else c.setHSL(.26 + r() * .05 - ti % 3 * .01, .42 + r() * .15, .2 + hi * .16 + r() * .05);
        f.setColorAt(n, c); n++;
      }
    });
    f.count = n; f.instanceMatrix.needsUpdate = true; if (f.instanceColor) f.instanceColor.needsUpdate = true; tr.instanceMatrix.needsUpdate = true;
  }, [list, clumps]);
  return <group>
    <instancedMesh ref={trunks} args={[undefined, undefined, list.length]} castShadow><cylinderGeometry args={[.7, 1, 1, 8]} /><meshStandardMaterial color="#5b4638" roughness={.95} /></instancedMesh>
    <instancedMesh ref={foliage} args={[undefined, undefined, total]} castShadow receiveShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial roughness={.9} flatShading /></instancedMesh>
  </group>;
}

/** Instanced flowers and bushes. */
export function Blooms({ spots }: { spots: { x: number; z: number; y?: number; r: number; n: number; kind: 'flower' | 'bush' }[] }) {
  const flowers = useRef<THREE.InstancedMesh>(null), bushes = useRef<THREE.InstancedMesh>(null);
  const nf = spots.filter(s => s.kind === 'flower').reduce((a, s) => a + s.n, 0), nb = spots.filter(s => s.kind === 'bush').reduce((a, s) => a + s.n, 0);
  useLayoutEffect(() => {
    const f = flowers.current, b = bushes.current; if (!f || !b) return; const r = rng(55), d = new THREE.Object3D(), c = new THREE.Color(); let i = 0, j = 0;
    spots.forEach(s => { for (let k = 0; k < s.n; k++) {
      const a = r() * 6.28, q = Math.sqrt(r()) * s.r, x = s.x + Math.cos(a) * q, z = s.z + Math.sin(a) * q;
      if (s.kind === 'flower') { d.position.set(x, (s.y ?? 0) + .12 + r() * .12, z); d.rotation.set(0, 0, 0); const sc = .06 + r() * .05; d.scale.set(sc, sc, sc); d.updateMatrix(); f.setMatrixAt(i, d.matrix); c.set(['#f6a9bf', '#ffffff', '#ffd27a', '#e58aa6', '#ffe4ec'][Math.floor(r() * 5)]); f.setColorAt(i, c); i++; }
      else { d.position.set(x, .38 + r() * .1, z); d.rotation.set(r(), r(), r()); const sc = .5 + r() * .3; d.scale.set(sc, sc * .85, sc); d.updateMatrix(); b.setMatrixAt(j, d.matrix); c.setHSL(.27 + r() * .04, .4, .2 + r() * .08); b.setColorAt(j, c); j++; }
    } });
    [f, b].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }, [spots]);
  return <group>
    <instancedMesh ref={flowers} args={[undefined, undefined, Math.max(1, nf)]}><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial roughness={.6} /></instancedMesh>
    <instancedMesh ref={bushes} args={[undefined, undefined, Math.max(1, nb)]} castShadow receiveShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial roughness={.95} flatShading /></instancedMesh>
  </group>;
}
