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
