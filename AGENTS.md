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

- Steering wheel (`SteeringWheel` in `scene/Van.tsx`): driver side, face tilted 35 degrees toward the driver, column into the dash. The van interior has no plants.

- Scroll journey (`src/components/journey/`): `Journey.tsx` is the road page under the 3D hero. The van and trailer are an SVG sprite that follows the scroll along a road path (positions come from sampled `getPointAtLength`), awnings open at each stop, and `art.tsx` holds the animated service illustrations and top down places. Words live in `src/config/services.ts`; styles in `journey.css` (day and night via `data-theme`).
- Sound: `src/lib/soundscape.ts` builds the ambient sound live with Web Audio (fountain, breeze, birds or crickets, pad, bells). `src/hooks/useSoundscape.ts` starts it on load, retries on the first gesture if the browser blocks it, and remembers a mute choice in localStorage (`sv-sound`).
- Day or night on first load follows the real sunrise and sunset in Atlanta, Georgia (`src/lib/georgiaTime.ts`); visitors can still switch. `?theme=day|night` overrides it.
- The 3D hero pauses its render loop when scrolled out of view (`active` prop on `StyleScene`).

- Journey backdrop (`src/components/journey/Backdrop.tsx`): a sticky viewport stage behind the whole journey. The sky, sun with sunglasses or moon, clouds, skylines, hills, drifting beauty tools, balloons, doves, petals or fireflies and a string light garland all move with scroll. Each service stop tints the scene.
- Copy rule: nothing on the page may state that a real van or trailer will arrive. Wording is imaginative (Picture it, Imagine) and ends with a call to action. Set the real phone number in `src/config/contact.ts` and every Call button becomes tap to call.
- Tour captions sit entirely inside one translucent glass bar (`.tour-hud` in `styles.css`).
- The van door awning has its own texture (`doorFull` in `livery.ts`) with the four services spread over the whole panel.

- Header menu: one hamburger (top right, next to the sound and day/night toggles) opens Book now, Sign in, About (scrolls to the journey), Contact us and the Explore panels. Sign in shows a coming soon note until a portal address is set in `src/config/contact.ts` (`portalUrl`).
- Forms never scroll sideways: `.panel-scroll` is `overflow-x: hidden`, grid columns use `minmax(0, 1fr)`, and inputs are `box-sizing: border-box` with `appearance: none`.
- The garland at the top of the journey backdrop is a row of swaying string light swags with round colored bulbs; keep its motion gentle.
