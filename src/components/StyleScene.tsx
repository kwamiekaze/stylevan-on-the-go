import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Van } from './scene/Van';
import { Trailer } from './scene/Trailer';
import { Estate } from './scene/Estate';
import { Butterflies } from './scene/Butterflies';
import { Clouds, Moon, ShootingStars, SkyDome, Stars, Sun } from './scene/Sky';
import { NightCtx } from './scene/theme';
import { GlbBoundary } from './scene/GlbVehicle';
import { models } from '@/config/models';

export type Theme = 'day' | 'night';
type SceneProps = { stage: number; theme: Theme; onUnavailable: () => void };

/** World layout: trailer behind (left), van in front (right), hitched together. */
const VAN_X = 2.65;
const TRAILER_X = -5.05;

const cameraStops: [number, number, number][] = [[8.6, 3.7, 14.6], [3.4, 2.0, 7.4], [-1.6, 2.6, 12.2], [8.4, 3.4, 13], [0, 1.6, 21]];
/** Portrait phones need a wider lens and a pulled back camera to fit a 12 m long rig. */
const narrowStops: [number, number, number][] = [[.6, 5.2, 31], [5.2, 3.2, 15.5], [-1.2, 3.4, 19.5], [.6, 5.2, 31]];
const narrowLooks: [number, number, number][] = [[-1.4, 3.6, 0], [2.4, 1.8, 0], [-1.4, 1.9, 0], [-1.4, 3.6, 0]];
const lookAts: [number, number, number][] = [[-.6, 1.3, 0], [.9, 1.5, 0], [-1.3, 1.5, 0], [-.6, 1.3, 0], [0, 30, -60]];

type Controls = { target: THREE.Vector3; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void; update: () => void };

/** Flies the camera to each stage, but gives up the moment the visitor grabs the controls. */
function CameraRig({ stage }: { stage: number }) {
  const { camera, size } = useThree();
  const controls = useThree(s => s.controls) as unknown as Controls | null;
  const active = useRef(true);
  const tp = useRef(new THREE.Vector3()), tl = useRef(new THREE.Vector3());
  const narrow = size.width < 700;
  useEffect(() => { active.current = true; }, [stage, narrow]);
  useEffect(() => {
    if (!controls) return;
    const stop = () => { active.current = false; };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls]);
  useFrame((_, delta) => {
    if (!controls) return;
    if (active.current) {
      const wide = size.width / size.height > 1.45 && (stage === 0 || stage === 3);
      const pan = wide ? -2.6 : 0;
      const stop = narrow ? (narrowStops[stage] ?? narrowStops[0]) : (cameraStops[stage] ?? cameraStops[0]);
      const la = narrow ? (narrowLooks[stage] ?? narrowLooks[0]) : (lookAts[stage] ?? lookAts[0]);
      const persp = camera as THREE.PerspectiveCamera;
      const fov = narrow ? 52 : 38;
      if (persp.fov !== fov) { persp.fov = fov; persp.updateProjectionMatrix(); }
      tp.current.set(stop[0] + pan, stop[1], narrow ? stop[2] : stop[2] * 1.05);
      tl.current.set(la[0] + pan, la[1], la[2]);
      const k = 1 - Math.exp(-2.4 * Math.min(delta, .05));
      camera.position.lerp(tp.current, k);
      controls.target.lerp(tl.current, k);
      if (camera.position.distanceTo(tp.current) < .05) active.current = false;
    }
    const t = controls.target;
    t.x = THREE.MathUtils.clamp(t.x, -18, 18); t.z = THREE.MathUtils.clamp(t.z, -14, 20); t.y = THREE.MathUtils.clamp(t.y, .4, 6);
  });
  return null;
}

/** Animates every light, the fog and the exposure between day and night. */
function ThemeDriver({ night, mix }: { night: boolean; mix: { current: number } }) {
  const { scene } = useThree();
  const amb = useRef<THREE.AmbientLight>(null), hemi = useRef<THREE.HemisphereLight>(null), dir = useRef<THREE.DirectionalLight>(null), fill = useRef<THREE.DirectionalLight>(null);
  const c = useMemo(() => ({
    fogD: new THREE.Color('#d6ecff'), fogN: new THREE.Color('#0d1440'),
    ambD: new THREE.Color('#fff6ea'), ambN: new THREE.Color('#5a68b0'),
    hsD: new THREE.Color('#bfe3ff'), hsN: new THREE.Color('#4a5bb0'), hgD: new THREE.Color('#d2c2a8'), hgN: new THREE.Color('#1c1a38'),
    dirD: new THREE.Color('#fff0d2'), dirN: new THREE.Color('#9db8ff'),
  }), []);
  useEffect(() => { scene.fog = new THREE.Fog('#d6ecff', 40, 118); }, [scene]);
  useFrame((_, dt) => {
    const target = night ? 1 : 0;
    mix.current += (target - mix.current) * (1 - Math.exp(-2.2 * Math.min(dt, .05)));
    if (Math.abs(target - mix.current) < .0005) mix.current = target;
    const m = mix.current;
    const fog = scene.fog as THREE.Fog | null; if (fog) fog.color.copy(c.fogD).lerp(c.fogN, m);
    if (amb.current) { amb.current.color.copy(c.ambD).lerp(c.ambN, m); amb.current.intensity = .5 - .32 * m; }
    if (hemi.current) { hemi.current.color.copy(c.hsD).lerp(c.hsN, m); hemi.current.groundColor.copy(c.hgD).lerp(c.hgN, m); hemi.current.intensity = 1.0 - .68 * m; }
    if (dir.current) { dir.current.color.copy(c.dirD).lerp(c.dirN, m); dir.current.intensity = 2.9 - 2.25 * m; }
    if (fill.current) fill.current.intensity = .5 * m;
  });
  return <>
    <ambientLight ref={amb} />
    <hemisphereLight ref={hemi} />
    <directionalLight ref={dir} position={[-9, 12, 10]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={13} shadow-camera-bottom={-11} shadow-bias={-.0004} />
    <directionalLight ref={fill} position={[10, 9, -8]} color="#b8c8ff" />
  </>;
}

function Vehicles({ stage }: { stage: number }) {
  return <Suspense fallback={null}>
    <group position={[VAN_X, 0, 0]}><GlbBoundary spec={models.van} fallback={<Van open={stage >= 2} />} /></group>
    <group position={[TRAILER_X, 0, 0]}><GlbBoundary spec={models.trailer} fallback={<Trailer open={stage >= 2} />} /></group>
  </Suspense>;
}

function World({ stage, theme }: { stage: number; theme: Theme }) {
  const { size } = useThree();
  const desktop = size.width > 900;
  const night = theme === 'night';
  const mix = useRef(night ? 1 : 0);
  return <NightCtx.Provider value={mix}>
    <ThemeDriver night={night} mix={mix} />
    <Environment resolution={256}>
      <Lightformer intensity={2.2} position={[0, 8, 4]} scale={[24, 10, 1]} />
      <Lightformer intensity={1.6} color={night ? '#9db4ff' : '#fff0d8'} position={[-12, 3, 6]} scale={[18, 7, 1]} />
      <Lightformer intensity={1.2} color="#ffd9e2" position={[12, 3, 8]} scale={[16, 6, 1]} />
    </Environment>
    <SkyDome /><Stars /><ShootingStars />
    <Sun position={[-26, 30, -68]} /><Moon position={[30, 32, -66]} />
    <Clouds />
    <Estate reflective={desktop} />
    <Vehicles stage={stage} />
    <Butterflies />
    {desktop && <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={.2} intensity={night ? .85 : .35} />
      <Vignette eskil={false} offset={.25} darkness={night ? .5 : .28} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>}
    <CameraRig stage={stage} />
    {/* Full 360 exploration: drag to orbit, scroll or pinch to zoom, right drag or two fingers to pan. */}
    <OrbitControls makeDefault enablePan enableZoom zoomSpeed={.7} panSpeed={.6} rotateSpeed={.6} minDistance={4.5} maxDistance={46} minPolarAngle={.15} maxPolarAngle={1.53} enableDamping dampingFactor={.07} target={[0, 1.4, 0]} />
  </NightCtx.Provider>;
}

export function StyleScene({ stage, theme, onUnavailable }: SceneProps) {
  const onError = useRef(onUnavailable);
  useEffect(() => { onError.current = onUnavailable; }, [onUnavailable]);
  return <Canvas className="scene-canvas" shadows dpr={[1, 1.75]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }} camera={{ position: cameraStops[0], fov: 38, near: .1, far: 260 }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = .85; gl.domElement.addEventListener('webglcontextlost', () => onError.current(), { once: true }); }} fallback={<div />}><World stage={stage} theme={theme} /></Canvas>;
}
