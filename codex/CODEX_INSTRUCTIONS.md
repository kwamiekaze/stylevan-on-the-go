# Codex handoff: ground shimmer fix and swipe hint

Repo: kwamiekaze/stylevan-on-the-go, branch `claude/optimistic-mayer-z2hsr7` (already contains these changes).
Do not rewrite published history (Lovable is connected). Make new commits only.

## Prompt to give Codex

> Pull branch `claude/optimistic-mayer-z2hsr7` and check that these four changes are present. If any is missing, apply it. Make no other changes.
>
> 1. `src/components/scene/Estate.tsx`: no hairline gold inlay planes on the plaza edge; the two curb boxes (`#efe4d6`) have no `receiveShadow`; the mansion path sits at y .02 (height 3.2, z -6.9), the fountain path at y .02 (height 9.9, z 12.55), the fountain court at .035 and its gold ring (inner radius 6.3) at .05, so nothing is coplanar.
> 2. `src/components/scene/Body.tsx` `SideWalls`: `skinMat` has `polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2`.
> 3. `src/routes/index.tsx`: a `.swipe-hint` div (word SWIPE, `ChevronUp` then `ChevronDown` below it) inside `.bottom-rail`, after the NEXT VIEW button; clicking it scrolls to `window.innerHeight * .9`. A `<section className="below-fold">` follows the `<main>`.
> 4. `src/styles.css`: the `.swipe-hint`, `.below-fold` and `.bottom-rail { touch-action: pan-y }` rules at the end of the file.
>
> Then run `npx vite build` and confirm it passes.

## What changed and why
- Ground flicker: thin planes 1 cm above the plaza, shadow-receiving curbs, and stone layers 2 mm apart caused shimmer at low camera angles. They are removed or separated.
- Swipe hint: right side of the bottom rail, under the white line. Touches on the rail scroll the page; touches on the scene still orbit.
- Tires were checked at close range and kept: van 0.84 m and trailer 0.72 m diameter, seated on the plaza.
- Doves were not built (skipped as agreed).

## Test URLs
`/?clean=1&open=1&theme=day&cam=3,.25,4,1,.2,1.5` (low grazing view), `/?theme=day` (swipe hint).
