import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Van } from './scene/Van';
import { Trailer } from './scene/Trailer';
import { Estate } from './scene/Estate';

type SceneProps = { stage: number; onUnavailable: () => void };

/** World layout: trailer behind (left), van in front (right), hitched together. */
const VAN_X = 2.65;
const TRAILER_X = -5.05;

const cameraStops: [number, number, number][] = [[8.6, 3.7, 14.6], [3.4, 2.0, 7.4], [-1.6, 2.6, 12.2], [8.4, 3.4, 13]];
/** Portrait phones need a wider lens and a pulled back camera to fit a 12 m long rig. */
const narrowStops: [number, number, number][] = [[.6, 5.2, 31], [5.2, 3.2, 15.5], [-1.2, 3.4, 19.5], [.6, 5.2, 31]];
const narrowLooks: [number, number, number][] = [[-1.4, 3.6, 0], [2.4, 1.8, 0], [-1.4, 1.9, 0], [-1.4, 3.6, 0]];
const lookAts: [number, number, number][] = [[-.6, 1.3, 0], [.9, 1.5, 0], [-1.3, 1.5, 0], [-.6, 1.3, 0]];

function CameraMove({ stage }: { stage: number }) {
  const { camera, size } = useThree();
  const last = useRef(stage);
  const moving = useRef(true);
  const target = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3(0, 1.4, 0));
  const lookTarget = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    if (last.current !== stage) { last.current = stage; moving.current = true; }
    const narrow = size.width < 700;
    const wide = size.width / size.height > 1.45 && (stage === 0 || stage === 3);
    const pan = wide ? -2.6 : 0;
    const stop = narrow ? (narrowStops[stage] ?? narrowStops[0]) : (cameraStops[stage] ?? cameraStops[0]);
    const la = narrow ? (narrowLooks[stage] ?? narrowLooks[0]) : (lookAts[stage] ?? lookAts[0]);
    const persp = camera as THREE.PerspectiveCamera;
    const fov = narrow ? 52 : 38;
    if (persp.fov !== fov) { persp.fov = fov; persp.updateProjectionMatrix(); }
    target.current.set(stop[0] + pan, stop[1], narrow ? stop[2] : stop[2] * 1.05);
    lookTarget.current.set(la[0] + pan, la[1], la[2]);
    if (!moving.current) return;
    const k = 1 - Math.exp(-2.4 * Math.min(delta, .05));
    camera.position.lerp(target.current, k);
    look.current.lerp(lookTarget.current, k);
    camera.lookAt(look.current);
    if (camera.position.distanceTo(target.current) < .04) moving.current = false;
  });
  return null;
}

function World({ stage }: { stage: number }) {
  const { size } = useThree();
  const desktop = size.width > 900;
  return <>
    <fog attach="fog" args={['#f0c9b4', 34, 95]} />
    <ambientLight intensity={.35} />
    <hemisphereLight args={['#ffe1bc', '#a68b80', .8]} />
    <directionalLight position={[-9, 11, 10]} intensity={2.6} color="#ffd6a8" castShadow shadow-mapSize-width={desktop ? 2048 : 1024} shadow-mapSize-height={desktop ? 2048 : 1024} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={12} shadow-camera-bottom={-10} shadow-bias={-.0004} />
    <Environment resolution={256}>
      <Lightformer intensity={2.2} position={[0, 8, 4]} scale={[24, 10, 1]} />
      <Lightformer intensity={2} color="#ffc9a3" position={[-12, 3, 6]} scale={[18, 7, 1]} />
      <Lightformer intensity={1.2} color="#ffd9e2" position={[12, 3, 8]} scale={[16, 6, 1]} />
    </Environment>
    <Estate reflective={desktop} />
    <Suspense fallback={null}>
      <group position={[VAN_X, 0, 0]}><Van open={stage >= 2} /></group>
      <group position={[TRAILER_X, 0, 0]}><Trailer open={stage >= 2} /></group>
    </Suspense>
    {desktop && <EffectComposer multisampling={0}><Bloom mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={.2} intensity={.42} /><Vignette eskil={false} offset={.25} darkness={.38} /><ToneMapping mode={ToneMappingMode.ACES_FILMIC} /></EffectComposer>}
    <CameraMove stage={stage} />
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={.75} maxPolarAngle={1.5} target={[0, 1.4, 0]} enableDamping dampingFactor={.06} />
  </>;
}

export function StyleScene({ stage, onUnavailable }: SceneProps) {
  const onError = useRef(onUnavailable);
  useEffect(() => { onError.current = onUnavailable; }, [onUnavailable]);
  return <Canvas className="scene-canvas" shadows dpr={[1, 1.75]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }} camera={{ position: cameraStops[0], fov: 38, near: .1, far: 200 }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = .7; gl.domElement.addEventListener('webglcontextlost', () => onError.current(), { once: true }); }} fallback={<div />}><World stage={stage} /></Canvas>;
}
