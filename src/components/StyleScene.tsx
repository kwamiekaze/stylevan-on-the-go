import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Van } from './scene/Van';
import { Trailer } from './scene/Trailer';
import { Estate, FLOOR_Y } from './scene/Estate';
import { TIRE_SQUASH } from './scene/Body';
import { Butterflies } from './scene/Butterflies';
import { Doves } from './scene/Doves';
import { Clouds, Moon, ShootingStars, SkyDome, Stars, Sun } from './scene/Sky';
import { NightCtx } from './scene/theme';
import { FlashCtx, headMat, signalMat, tailMat } from './scene/lights';
import { GlbBoundary } from './scene/GlbVehicle';
import { models } from '@/config/models';
import { INTRO, TOUR_LENGTH, INTRO_LENGTH, TOUR, sample, makeSample, type Key } from './scene/cinema';

export type Theme = 'day' | 'night';
type SceneProps = { active?: boolean; onReady?: (() => void) | undefined; stage: number; theme: Theme; open: boolean; flash: { n: number; times: number }; tour: boolean; tourStart?: number; skipIntro?: boolean; onTourTime: (t: number) => void; onTourEnd: () => void; onUnavailable: () => void };

/** World layout: trailer behind (left), van in front (right), hitched together. */
const VAN_X = 2.65;
const TRAILER_X = -5.05;

const cameraStops: [number, number, number][] = [[8.6, 3.7, 14.6], [3.4, 2.0, 7.4], [-1.6, 2.6, 12.2], [8.4, 3.4, 13], [0, 1.6, 21]];
/** Portrait phones need a wider lens and a pulled back camera to fit a 12 m long rig. */
const narrowStops: [number, number, number][] = [[.6, 5.2, 31], [5.2, 3.2, 15.5], [-1.2, 3.4, 19.5], [.6, 5.2, 31]];
const narrowLooks: [number, number, number][] = [[-1.4, 3.6, 0], [2.4, 1.8, 0], [-1.4, 1.9, 0], [-1.4, 3.6, 0]];
const lookAts: [number, number, number][] = [[-.6, 1.3, 0], [.9, 1.5, 0], [-1.3, 1.5, 0], [-.6, 1.3, 0], [0, 30, -60]];

type Controls = { target: THREE.Vector3; enabled: boolean; autoRotate: boolean; autoRotateSpeed: number; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void; update: () => void };
type Mode = 'intro' | 'fly' | 'free' | 'tour';

/**
 * One camera brain. Intro: a stable scripted dolly on first load. Free: slow drift orbit that
 * yields to the visitor. Fly: NEXT VIEW moves. Tour: the scripted interior film.
 */
function CameraRig({ stage, tour, tourStart, skipIntro, paused, onTourTime, onTourEnd }: { stage: number; tour: boolean; tourStart: number; skipIntro: boolean; paused: boolean; onTourTime: (t: number) => void; onTourEnd: () => void }) {
  const { camera, size } = useThree();
  const controls = useThree(s => s.controls) as unknown as Controls | null;
  const mode = useRef<Mode>(skipIntro ? 'fly' : 'intro');
  const clock = useRef(0), lastEmit = useRef(0), first = useRef(true);
  const tp = useRef(new THREE.Vector3()), tl = useRef(new THREE.Vector3());
  const smp = useRef(makeSample());
  const tourLight = useRef<THREE.PointLight>(null);
  const narrow = size.width < 700;
  const kN = narrow ? 1.45 : 1;

  useEffect(() => { const q = new URLSearchParams(window.location.search).get('cam'); if (q && controls) { const v = q.split(',').map(Number); camera.position.set(v[0], v[1], v[2]); controls.target.set(v[3], v[4], v[5]); camera.lookAt(v[3], v[4], v[5]); mode.current = 'free'; controls.autoRotate = false; } }, [controls, camera]);
  useEffect(() => { if (first.current) { first.current = false; return; } if (mode.current !== 'tour') mode.current = 'fly'; }, [stage, narrow]);
  useEffect(() => {
    if (tour) { mode.current = 'tour'; clock.current = tourStart; lastEmit.current = -1; }
    else if (mode.current === 'tour') mode.current = 'fly';
  }, [tour, tourStart]);
  useEffect(() => {
    if (!controls) return;
    const grab = () => { if (mode.current === 'intro' || mode.current === 'fly') mode.current = 'free'; };
    controls.addEventListener('start', grab);
    return () => controls.removeEventListener('start', grab);
  }, [controls]);

  const apply = (keys: Key[], t: number, time: number) => {
    const s = sample(keys, t, smp.current);
    const scale = 1 + (kN - 1) * s.w;
    tp.current.copy(s.p).sub(s.l).multiplyScalar(scale).add(s.l);
    // gentle operator float, small enough to read as a stabilised gimbal
    tp.current.x += Math.sin(time * .9) * .035; tp.current.y += Math.sin(time * .7 + 1) * .03; tp.current.z += Math.sin(time * .8 + 2) * .035;
    camera.position.copy(tp.current);
    controls!.target.copy(s.l);
    camera.lookAt(s.l);
    const persp = camera as THREE.PerspectiveCamera;
    const fov = s.fov + (narrow ? 10 * (1 - s.w) + 12 * s.w : 0);
    if (Math.abs(persp.fov - fov) > .01) { persp.fov = fov; persp.updateProjectionMatrix(); }
  };

  useFrame((state, delta) => {
    if (paused) return;                 // warm-up frames behind the splash must not use up the opening camera move
    if (!controls) return;
    const dt = Math.min(delta, .05), time = state.clock.elapsedTime;
    const m = mode.current;
    controls.enabled = m !== 'tour';
    controls.autoRotate = m === 'free' && !new URLSearchParams(window.location.search).get('cam');
    controls.autoRotateSpeed = .45;
    if (tourLight.current) tourLight.current.intensity = m === 'tour' ? 1.6 : 0;
    if (m === 'tour') {
      clock.current += dt;
      apply(TOUR, clock.current, time);
      if (tourLight.current) tourLight.current.position.copy(camera.position);
      if (clock.current - lastEmit.current > .12) { lastEmit.current = clock.current; onTourTime(clock.current); }
      if (clock.current >= TOUR_LENGTH) { onTourEnd(); mode.current = 'free'; }
      return;
    }
    if (m === 'intro') {
      clock.current += dt;
      apply(INTRO, clock.current, time);
      if (clock.current >= INTRO_LENGTH) mode.current = 'free';
      return;
    }
    if (m === 'fly') {
      const wide = size.width / size.height > 1.45 && (stage === 0 || stage === 3);
      const pan = wide ? -2.6 : 0;
      const stop = narrow ? (narrowStops[stage] ?? narrowStops[0]) : (cameraStops[stage] ?? cameraStops[0]);
      const la = narrow ? (narrowLooks[stage] ?? narrowLooks[0]) : (lookAts[stage] ?? lookAts[0]);
      const persp = camera as THREE.PerspectiveCamera;
      const fov = narrow ? 52 : 38;
      if (Math.abs(persp.fov - fov) > .01) { persp.fov += (fov - persp.fov) * .08; persp.updateProjectionMatrix(); }
      tp.current.set(stop[0] + pan, stop[1], narrow ? stop[2] : stop[2] * 1.05);
      tl.current.set(la[0] + pan, la[1], la[2]);
      const k = 1 - Math.exp(-2.2 * dt);
      camera.position.lerp(tp.current, k);
      controls.target.lerp(tl.current, k);
      if (camera.position.distanceTo(tp.current) < .06) mode.current = 'free';
    } else {
      // free: a whisper of vertical drift so the frame never feels frozen
      controls.target.y += Math.sin(time * .35) * .0012;
    }
    const t = controls.target;
    t.x = THREE.MathUtils.clamp(t.x, -18, 18); t.z = THREE.MathUtils.clamp(t.z, -14, 22); t.y = THREE.MathUtils.clamp(t.y, .4, 6);
  });
  return <pointLight ref={tourLight} intensity={0} distance={4.5} decay={1.6} color="#ffe2c2" />;
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
    <directionalLight ref={dir} position={[-9, 12, 10]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={13} shadow-camera-bottom={-11} shadow-bias={-.0002} shadow-normalBias={.025} />
    <directionalLight ref={fill} position={[10, 9, -8]} color="#b8c8ff" />
  </>;
}

function FlashDriver({ flash, level }: { flash: { n: number; times: number }; level: { current: number } }) {
  const seq = useRef({ t: -1, times: 0 });
  useEffect(() => { if (flash.n > 0) seq.current = { t: 0, times: flash.times }; }, [flash.n, flash.times]);
  useFrame((_, dt) => {
    const s = seq.current; let target = 0;
    if (s.t >= 0) { s.t += dt; const idx = Math.floor(s.t / .55); if (idx >= s.times) s.t = -1; else target = s.t - idx * .55 < .3 ? 1 : 0; }
    if (typeof window !== 'undefined' && window.location.search.includes('flash=1')) target = 1; // screenshot aid
    level.current += (target - level.current) * Math.min(1, dt * 30);
    const v = level.current;
    headMat.emissiveIntensity = .45 + 7 * v; signalMat.emissiveIntensity = .25 + 9 * v; tailMat.emissiveIntensity = 1.0 + 5 * v;
  });
  return null;
}

/**
 * Ride height: the tires flatten TIRE_SQUASH into a contact patch, so the rig sits that much lower and
 * the patch lands a hair above the polished floor. Nothing ever shares a depth with the floor or with
 * its own reflection, which is what used to shimmer along the tires and sills.
 */
const RIDE = FLOOR_Y + .0015 - TIRE_SQUASH;

const _bb = new THREE.Box3(), _sz = new THREE.Vector3(), _ws = new THREE.Vector3();
/**
 * The mirrored copy of the vehicles is only a reflection, so it never casts or receives shadows and it
 * leaves out hairline parts (gold trim strips, thin rods and rails). Those are a few pixels wide, so as
 * the camera moves they alias and crawl in the reflection. The real vehicle keeps all of them.
 */
function NoShadows({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null), n = useRef(0);
  useFrame(() => {
    if (n.current > 240 || !g.current) return; n.current++;
    if (n.current % 6 !== 1) return; // meshes mount lazily, so sweep a few times early on
    g.current.traverse(o => {
      o.castShadow = false; o.receiveShadow = false;
      const m = o as THREE.Mesh; if (!m.isMesh || !m.geometry) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      _bb.copy(m.geometry.boundingBox!); _bb.getSize(_sz); m.getWorldScale(_ws); _sz.multiply(_ws);
      const a = [Math.abs(_sz.x), Math.abs(_sz.y), Math.abs(_sz.z)].sort((p, q) => p - q);
      if (a[1]! < .03 && a[2]! > .3) m.visible = false; // long and hairline in both other directions
    });
  });
  return <group ref={g}>{children}</group>;
}

function Vehicles({ open, mirror }: { open: boolean; mirror: boolean }) {
  return <Suspense fallback={null}>
    {/* mobile reflection: the rig mirrored about the floor plane itself, not about y = 0 */}
    {mirror && <group position-y={2 * FLOOR_Y} scale={[1, -1, 1]}><NoShadows><group position={[VAN_X, RIDE, 0]}><Van open={open} ghost /></group><group position={[TRAILER_X, RIDE, 0]}><Trailer open={open} ghost /></group></NoShadows></group>}
    <group position={[VAN_X, RIDE, 0]}><GlbBoundary spec={models.van} fallback={<Van open={open} />} /></group>
    <group position={[TRAILER_X, RIDE, 0]}><GlbBoundary spec={models.trailer} fallback={<Trailer open={open} />} /></group>
  </Suspense>;
}

/**
 * While the splash video plays the scene is not animating, but it still draws a few still frames. That compiles every
 * shader and uploads every texture to the graphics card ahead of time, so the first moment the visitor sees the scene
 * is smooth, and tells the page when it is ready.
 */
function WarmUp({ active, onReady }: { active: boolean; onReady?: (() => void) | undefined }) {
  const { gl, scene, camera, invalidate } = useThree();
  const frames = useRef(0), fired = useRef(false);
  useEffect(() => { try { void (gl as unknown as { compileAsync?: (s: unknown, c: unknown) => Promise<unknown> }).compileAsync?.(scene, camera); } catch { /* compile on first frame instead */ } }, [gl, scene, camera]);
  useEffect(() => {
    if (active) return;
    let n = 0; const id = window.setInterval(() => { invalidate(); if (++n >= 6) window.clearInterval(id); }, 200);
    return () => window.clearInterval(id);
  }, [active, invalidate]);
  useFrame(() => { frames.current++; if (!fired.current && frames.current >= 5) { fired.current = true; onReady?.(); } });
  return null;
}

function World({ stage, theme, open, flash, tour, tourStart, skipIntro, active, onReady, onTourTime, onTourEnd }: Omit<SceneProps, 'onUnavailable'>) {
  const { size } = useThree();
  const desktop = size.width > 900;
  const night = theme === 'night';
  const mix = useRef(night ? 1 : 0);
  const level = useRef(0);
  return <NightCtx.Provider value={mix}>
    <WarmUp active={active !== false} onReady={onReady} />
    <ThemeDriver night={night} mix={mix} />
    <Environment resolution={256}>
      <Lightformer intensity={2.2} position={[0, 8, 4]} scale={[24, 10, 1]} />
      <Lightformer intensity={1.6} color={night ? '#9db4ff' : '#fff0d8'} position={[-12, 3, 6]} scale={[18, 7, 1]} />
      <Lightformer intensity={1.2} color="#ffd9e2" position={[12, 3, 8]} scale={[16, 6, 1]} />
    </Environment>
    <SkyDome /><Stars /><ShootingStars />
    <Sun position={[-26, 30, -68]} /><Moon position={[30, 32, -66]} />
    <Clouds />
    <Estate reflective={desktop} mobile={!desktop} />
    <FlashCtx.Provider value={level}><FlashDriver flash={flash} level={level} /><Vehicles open={open || tour} mirror={!desktop} /></FlashCtx.Provider>
    <Butterflies />
    <Doves />
    {desktop && <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={.2} intensity={night ? .85 : .35} />
      <Vignette eskil={false} offset={.25} darkness={night ? .5 : .28} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>}
    <CameraRig stage={stage} tour={tour} tourStart={tourStart ?? 0} skipIntro={!!skipIntro} paused={active === false} onTourTime={onTourTime} onTourEnd={onTourEnd} />
    {/* Full 360 exploration: drag to orbit, scroll or pinch to zoom, right drag or two fingers to pan. */}
    <OrbitControls makeDefault enablePan enableZoom zoomSpeed={.7} panSpeed={.6} rotateSpeed={.6} minDistance={4.5} maxDistance={46} minPolarAngle={.15} maxPolarAngle={1.53} enableDamping dampingFactor={.07} target={[0, 1.4, 0]} />
  </NightCtx.Provider>;
}

export function StyleScene({ onUnavailable, active = true, ...rest }: SceneProps) {
  const onError = useRef(onUnavailable);
  useEffect(() => { onError.current = onUnavailable; }, [onUnavailable]);
  return <Canvas className="scene-canvas" frameloop={active ? 'always' : 'demand'} shadows dpr={[1, 1.6]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }} camera={{ position: INTRO[0].p, fov: 36, near: 1, far: 170 }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = .85; gl.domElement.addEventListener('webglcontextlost', () => onError.current(), { once: true }); }} fallback={<div />}><World active={active} {...rest} /></Canvas>;
}
