import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, useTexture } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import marble from '@/assets/marble.png.asset.json';

type SceneProps = { stage: number; onUnavailable: () => void };
const ivory = '#f4e9df';
const blush = '#dfb6b7';
const gold = '#bb9565';
const wine = '#512b36';
const glass = '#4d5458';

function Box({ position, size, color, metalness = 0, roughness = .5, castShadow = true }: { position: [number, number, number]; size: [number, number, number]; color: string; metalness?: number; roughness?: number; castShadow?: boolean }) {
  return <mesh position={position} castShadow={castShadow} receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} metalness={metalness} roughness={roughness} /></mesh>;
}

function Wheel({ x, z, radius = .46 }: { x: number; z: number; radius?: number }) {
  return <group position={[x, radius, z]} rotation-x={Math.PI / 2}>
    <mesh castShadow><cylinderGeometry args={[radius, radius, .19, 24]} /><meshStandardMaterial color="#252326" roughness={.9} /></mesh>
    <mesh position={[0, .102, 0]}><cylinderGeometry args={[radius * .58, radius * .58, .016, 20]} /><meshStandardMaterial color={gold} metalness={.85} roughness={.2} /></mesh>
    <mesh position={[0, .114, 0]}><cylinderGeometry args={[radius * .18, radius * .18, .02, 16]} /><meshStandardMaterial color={ivory} metalness={.7} roughness={.2} /></mesh>
  </group>;
}

function MarblePanel({ position, size, rotation = [0,0,0] }: { position: [number,number,number]; size: [number,number]; rotation?: [number,number,number] }) {
  const texture = useTexture(marble.url);
  return <mesh position={position} rotation={rotation}><planeGeometry args={size} /><meshStandardMaterial map={texture} roughness={.36} metalness={.05} /></mesh>;
}

function Van({ open }: { open: boolean }) {
  const door = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (door.current) door.current.position.x = THREE.MathUtils.damp(door.current.position.x, open ? -1.48 : 0, 3.5, Math.min(delta,.05)); });
  return <group position={[2.65, 0, 0]}>
    <Box position={[-.6, 1.58, 0]} size={[4.55, 2.52, 2.18]} color={ivory} roughness={.29} />
    <Box position={[2.02, 1.44, 0]} size={[1.38, 2.07, 2.12]} color={ivory} roughness={.3} />
    <Box position={[2.34, 2.61, 0]} size={[.82, .32, 2.05]} color={ivory} />
    <Box position={[-.6, 2.88, 0]} size={[4.44, .16, 2.04]} color={ivory} />
    <Box position={[1.93, 2.11, 1.065]} size={[1.06, .87, .045]} color={glass} metalness={.4} roughness={.13} />
    <Box position={[1.93, 2.11, -1.065]} size={[1.06, .87, .045]} color={glass} metalness={.4} roughness={.13} />
    <Box position={[2.73, 1.72, 0]} size={[.05, .9, 1.8]} color={glass} metalness={.4} roughness={.15} />
    <Box position={[1.66, 1.45, 1.17]} size={[.38, .18, .26]} color={glass} metalness={.5} />
    <Box position={[1.66, 1.45, -1.17]} size={[.38, .18, .26]} color={glass} metalness={.5} />
    <Box position={[2.8, .75, 0]} size={[.15, .24, 2.04]} color={gold} metalness={.8} />
    <Box position={[2.76, 1.04, .8]} size={[.06, .3, .33]} color={ivory} />
    <Box position={[2.76, 1.04, -.8]} size={[.06, .3, .33]} color={ivory} />
    <Box position={[-.58, .42, 0]} size={[4.5, .23, 2.17]} color={wine} roughness={.4} />
    <MarblePanel position={[-.58, 1.12, -1.105]} size={[4.44,.78]} />
    <MarblePanel position={[-1.88, 1.16, 1.109]} size={[1.72,.8]} />
    <Box position={[-.58, 1.54, -1.12]} size={[4.52,.025,.025]} color={gold} metalness={.8} />
    <Box position={[-.58, .73, -1.12]} size={[4.52,.025,.025]} color={gold} metalness={.8} />
    <Box position={[-1.9, 2.03, -1.111]} size={[1.38,.75,.04]} color={glass} metalness={.4} roughness={.16} />
    <Box position={[-2.2, 2.02, 1.12]} size={[.9,.7,.04]} color={glass} metalness={.4} roughness={.16} />
    {/* Sliding door reveals a lit salon bay when the tour advances. */}
    <Box position={[-.2, 1.62, 1.103]} size={[1.42, 1.75, .025]} color={open ? gold : ivory} />
    <group ref={door}>
      <Box position={[-.2, 1.82, 1.14]} size={[1.46, 2.02, .085]} color={ivory} roughness={.25} />
      <MarblePanel position={[-.2, 1.13, 1.191]} size={[1.4,.68]} />
      <Box position={[-.69, 1.79, 1.2]} size={[-.18,.055,.035]} color={gold} />
    </group>
    {open && <group><Box position={[-.2, .64, 1.63]} size={[1.48,.12,.95]} color={gold} metalness={.5} /><Box position={[-.2, .36, 1.95]} size={[1.48,.1,.65]} color={wine} /><pointLight position={[-.2,1.7,1.55]} intensity={2.5} distance={4} color="#ffd4a0" /></group>}
    {[-1.9, 1.55].map(x => [-1.06,1.06].map(z => <Wheel key={`${x}-${z}`} x={x} z={z} />))}
  </group>;
}

function Trailer({ open }: { open: boolean }) {
  const awning = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (awning.current) awning.current.rotation.x = THREE.MathUtils.damp(awning.current.rotation.x, open ? -.92 : 0, 3, Math.min(delta,.05)); });
  return <group position={[-5.05,0,0]}>
    <Box position={[0,1.76,0]} size={[5.9,2.69,2.43]} color={ivory} roughness={.3} />
    <Box position={[0,.51,0]} size={[5.94,.28,2.47]} color={wine} />
    <Box position={[0,3.17,0]} size={[5.98,.14,2.49]} color={ivory} />
    <MarblePanel position={[.05,1.06,-1.231]} size={[5.78,.89]} />
    <MarblePanel position={[-1.96,1.1,1.231]} size={[1.74,.9]} />
    <MarblePanel position={[2.23,1.1,1.231]} size={[1.33,.9]} />
    <Box position={[0,1.55,-1.248]} size={[5.88,.03,.03]} color={gold} metalness={.8} />
    <Box position={[0,3.04,1.235]} size={[5.96,.06,.04]} color={gold} metalness={.8} />
    <Box position={[-.05,1.97,1.215]} size={[3.02,1.77,.07]} color={open ? wine : ivory} />
    <group ref={awning} position={[-.05,2.94,1.26]}>
      <Box position={[0,-.84,.03]} size={[3.2,1.72,.09]} color={ivory} roughness={.27} />
      <MarblePanel position={[0,-.85,.087]} size={[3.06,1.6]} />
    </group>
    {open && <group>
      <Box position={[-1.27,1.84,1.29]} size={[.63,1.18,.23]} color={blush} />
      <Box position={[.16,1.92,1.29]} size={[1.36,1.08,.18]} color={gold} metalness={.58} />
      <Box position={[1.02,.8,1.33]} size={[.85,.18,.34]} color={blush} />
      <Box position={[-.05,.46,1.8]} size={[2.85,.13,.97]} color={gold} metalness={.5} />
      <pointLight position={[-.1,2.2,1.7]} intensity={3.2} distance={5} color="#ffca8a" />
    </group>}
    {[-1.42,.42].map(x => [-1.18,1.18].map(z => <Wheel key={`${x}-${z}`} x={x} z={z} radius={.44} />))}
    <Box position={[3.26,.74,0]} size={[.72,.09,.1]} color={gold} metalness={.8} />
  </group>;
}

const cameraStops: [number,number,number][] = [[10,5.4,18],[2.5,4.4,18],[-7.5,3.9,15],[8,4.8,16]];
function CameraMove({ stage }: { stage: number }) {
  const { camera } = useThree();
  const last = useRef(stage);
  const moving = useRef(true);
  const target = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    if (last.current !== stage) { last.current = stage; moving.current = true; }
    if (!moving.current) return;
    target.current.set(...cameraStops[stage]);
    camera.position.lerp(target.current, 1 - Math.exp(-2.5 * Math.min(delta,.05)));
    camera.lookAt(0,1.3,0);
    if (camera.position.distanceTo(target.current) < .04) moving.current = false;
  });
  return null;
}

function Estate() {
  return <group>
    <Box position={[0,-.11,0]} size={[100,.2,100]} color="#d0bfb1" roughness={.22} metalness={.14} castShadow={false} />
    <Box position={[0,-.003,0]} size={[19,.014,7]} color="#ede2d8" roughness={.16} metalness={.2} castShadow={false} />
    <Box position={[0,-.01,-5.4]} size={[25,.06,3]} color="#bbc0a4" castShadow={false} />
    <Box position={[0,2.9,-9]} size={[23,5.8,2.2]} color="#e5d5c7" roughness={.8} />
    <Box position={[0,6.1,-9]} size={[24.1,.36,3.1]} color="#d3b89b" />
    {[-9,-5,-1,3,7].map(x => <group key={x}>
      <Box position={[x,3.2,-7.84]} size={[1.5,4.3,.06]} color="#514448" metalness={.3} roughness={.19} />
      <Box position={[x,3.2,-7.79]} size={[.025,4.3,.06]} color={gold} metalness={.7} />
      <Box position={[x,3.2,-7.78]} size={[1.5,.03,.06]} color={gold} metalness={.7} />
    </group>)}
    {[-11.7,11.7].map(x => <group key={x}>
      <Box position={[x,1.22,-6.6]} size={[.28,2.45,.3]} color="#dfd2bf" />
      <mesh position={[x,3.05,-6.5]}><sphereGeometry args={[.38,12,10]} /><meshStandardMaterial color="#ffd9a1" emissive="#ffc278" emissiveIntensity={.8} /></mesh>
    </group>)}
  </group>;
}

function World({ stage }: { stage: number }) {
  return <>
    <color attach="background" args={['#ebd2bd']} />
    <fog attach="fog" args={['#ebd2bd',24,65]} />
    <ambientLight intensity={1.15} />
    <hemisphereLight args={['#ffe1bc','#a68b80',1.5]} />
    <directionalLight position={[-6,12,9]} intensity={3.1} color="#ffdcb3" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={15} shadow-camera-bottom={-15} />
    <Environment><Lightformer intensity={2} position={[0,8,3]} scale={[20,12,1]} /><Lightformer intensity={1.5} color="#ffcfaa" position={[-10,2,5]} scale={[15,6,1]} /></Environment>
    <Estate />
    <Suspense fallback={null}><Van open={stage >= 2} /><Trailer open={stage >= 2} /></Suspense>
    <CameraMove stage={stage} />
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={.7} maxPolarAngle={1.48} target={[0,1.3,0]} enableDamping dampingFactor={.06} />
  </>;
}

export function StyleScene({ stage, onUnavailable }: SceneProps) {
  const onError = useRef(onUnavailable);
  useEffect(() => { onError.current = onUnavailable; }, [onUnavailable]);
  return <Canvas className="scene-canvas" shadows dpr={[1,1.5]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} camera={{ position: cameraStops[0], fov: 39, near: .1, far: 100 }} onCreated={({gl}) => { gl.domElement.addEventListener('webglcontextlost', () => onError.current(), { once: true }); }} fallback={<div />}><World stage={stage} /></Canvas>;
}
