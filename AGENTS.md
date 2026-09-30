<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the homepage as a client-only TanStack route: React Three Fiber requires browser WebGL and panel navigation remains layered over the scene.
- Keep procedural van/trailer geometry isolated in `StyleScene.tsx`: production models can replace them without changing page content or navigation.
- Store supplied media as CDN asset pointers under `src/assets`: source images stay out of the Git repository while remaining available to the scene and gallery.
- Never claim a booking was submitted until Cloud-backed persistence confirms it: this initial project has no database connection yet.

- All text printed on the vehicles lives in `src/config/brand.ts` (wordmark, tagline, services, phone, website) and is drawn to a canvas by `src/components/scene/livery.ts`: edit the config and the 3D van and trailer repaint. Logo position and size are in `livery` in the same file. No image regeneration needed.
- Scene is split by part: `scene/Van.tsx`, `scene/Trailer.tsx`, `scene/Estate.tsx`, shared primitives in `scene/parts.tsx`. Dimensions are meters, 1 unit = 1 m.
- `?stage=0..3` in the URL jumps the camera to a stage, useful for screenshots.

- Day and night: `theme` state in `routes/index.tsx` (header toggle, `?theme=day|night`, defaults by visitor local time). `scene/theme.ts` holds the shared 0..1 night mix; `StyleScene.tsx` `ThemeDriver` animates lights and fog. Sky, stars, moon, sun with sunglasses, clouds live in `scene/Sky.tsx`; butterflies in `scene/Butterflies.tsx`.
- Free 360 exploration uses OrbitControls (drag orbit, scroll or pinch zoom, right drag pan). The NEXT VIEW button flies the camera and stops the moment the visitor touches the controls. `?stage=4` is a debug sky view.
- Generated Higgsfield GLBs are wired through `src/config/models.ts` (empty url = procedural vehicles). Text baked into a GLB is not editable from `brand.ts`.

- Key fob: `locked` state in `routes/index.tsx` drives `open` on the scene. Lock flashes the lamps once, unlock twice (`scene/lights.ts` holds the shared lamp materials and the chirp). The tour auto unlocks. `?open=1` starts unlocked.
- The tour is exterior only: the camera glides past the open van and trailer doors and scans the interiors from outside. Keep camera keys outside the vehicles and clear of the tree ring (trees live at radius 40 to 56).
- Mansion geometry is documented at the top of `scene/Mansion.tsx`: balustrades sit on the terrace inside the cornice edge, roofs start 0.5 m inside the balustrade.
- `?cam=x,y,z,tx,ty,tz` places the camera for screenshots.

- Van rear: two doors open with the `open` flag, lettering lives in `drawRear` in `scene/livery.ts`. Wheels sit fully outside the body (`Fender` in `scene/parts.tsx`), so no tire cuts through a floor or wall. Paved areas are defined once in `paved()` in `scene/Grounds.tsx`; grass and trees stay off them.

- Van is a step van (`scene/Van.tsx`), dimensions documented at the top of the file. Side walls and printed skins come from one outline in `scene/Body.tsx` (`SideWalls`), which cuts real wheel arches, so tires never pass through a wall or floor. Wheels (`Wheel` in Body.tsx) are white steel disc wheels with treaded tires; the van runs duals at the rear.
- Van rear doors stay closed; the trailer rear doors open with the key fob (`RearDoors` in Body.tsx). Both use `drawRear` lettering.

- Ground: nothing thin or shadow receiving sits on the plaza edge (hairline gold inlays removed, curb does not receive shadows), stone paths and the fountain court sit at distinct heights (.02, .035, .05) so no coplanar overlap shimmers, and the printed body skin uses polygonOffset. Keep new ground decals at least 1 cm apart in height.
- Swipe hint: `.swipe-hint` in the bottom rail (right side, under the white line) scrolls the page up to `.below-fold`, a placeholder section under the hero to be designed later. The rail has `touch-action: pan-y` so touches there scroll the page instead of orbiting the scene.

- Doves (`scene/Doves.tsx`): white doves visit the fountain 20 s, 25 s, then 30 s apart and repeat; about one visit in three brings two birds. Screenshot only URL switches: `?dove=1` (first visit early), `?dove=perch` or `?dove=perch2` (one or two already perched).
- Wheel housings: the interior wheel covers sit behind the rim faces with dark backing plates, the trailer undercarriage slab is dark, and both van arches have `ArchCover`, so no light body edge shows above or beside a tire.

- Flicker rules: the wall face sits 12 mm behind the printed skin (`SideWalls`), thin shiny trim is softened in `Box` (`parts.tsx`) so it does not glint or crawl when the camera moves, the underbody plates sit clear of the wall bottoms, and the camera near plane is 1 (far 170) for depth precision. `ArchCover` has the same orientation on both sides.

- Skyline (`scene/Skyline.tsx`): glass towers 150 to 185 m out, baked into merged meshes per glass palette, shared by the real scene and the mirrored copy on phones. The sky sphere is radius 260, the sun and moon sit at 2.65x, camera far is 420. A far ground disc with the plaza hole gives the horizon.
- Steering wheel (`SteeringWheel` in `scene/Van.tsx`): driver side, face tilted 35 degrees toward the driver, column into the dash. The van interior has no plants.
