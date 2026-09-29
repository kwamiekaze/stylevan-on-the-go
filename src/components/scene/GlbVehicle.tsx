import { Component, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';

export type GlbSpec = { url: string; scale: number; position: [number, number, number]; rotationY: number };

function Model({ spec }: { spec: GlbSpec }) {
  const { scene } = useGLTF(spec.url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} scale={spec.scale} position={spec.position} rotation-y={spec.rotationY} />;
}

/** Renders a generated GLB. If it fails to load, the procedural fallback shows instead. */
export class GlbBoundary extends Component<{ spec: GlbSpec; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed || !this.props.spec.url ? this.props.fallback : <Model spec={this.props.spec} />; }
}
