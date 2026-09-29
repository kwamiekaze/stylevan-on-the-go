/**
 * Optional generated 3D models (Higgsfield / Meshy). Leave `url` empty to use the
 * editable procedural vehicles. To try a generated GLB, drop it in /public/models
 * and set e.g. url: '/models/style-van.glb', then tune scale/position/rotationY.
 * If a model fails to load, the procedural vehicle is shown automatically.
 * Note: a baked model cannot be edited from brand.ts, so keep text on the procedural livery.
 */
export const models = {
  van: { url: '', scale: 1, position: [0, 0, 0] as [number, number, number], rotationY: 0 },
  trailer: { url: '', scale: 1, position: [0, 0, 0] as [number, number, number], rotationY: 0 },
} as const;
