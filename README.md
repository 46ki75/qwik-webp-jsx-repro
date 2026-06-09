# Qwik v2 — raster image `?jsx` import fails in the client environment

Minimal reproduction for a bug in `@qwik.dev/router@2.0.0-beta.37`.

Importing a **raster** image (`.webp`, `.png`, `.jpg`, …) with the `?jsx`
suffix throws a Vite resolve error in the **client** build environment:

```
Failed to resolve import
"virtual:/…/src/assets/image.webp.qwik.jsx?jsx="
from "virtual:/…/src/assets/image.webp.qwik.jsx?jsx=". Does the file exist?
```

**SVG** `?jsx` imports are unaffected and work fine.

## Versions

| package            | version          |
| ------------------ | ---------------- |
| `@qwik.dev/core`   | `2.0.0-beta.37`  |
| `@qwik.dev/router` | `2.0.0-beta.37`  |
| `vite`             | `7.3.2`          |
| node               | `>=18.17`        |

## Reproduce

```bash
pnpm install   # or npm install

# Option A — headless, no browser (deterministic, CI-friendly):
pnpm repro
#   => ssr environment:    transformRequest ... OK
#   => client environment: transformRequest ... FAIL
#   exits non-zero when the bug is present

# Option B — real dev server:
pnpm dev
#   open the printed URL; the page shows a Vite error overlay with the
#   "Failed to resolve import" message above.
```

## What happens

A `image.webp?jsx` import is expanded by the `qwik-router-image-jsx` plugin
into a virtual module:

```js
// virtual:/…/image.webp.qwik.jsx?jsx=
import { srcSet, width, height } from "/…/image.webp?jsx=&qwik-asset-jsx=";
import toImg from "@to-img.qwik.jsx";
export default toImg(srcSet, width, height);
```

Both child imports resolve correctly when resolved directly (see the
`resolveId(...)` lines printed by `pnpm repro`), and the **ssr** environment
transforms the module fine. Only the full **client** environment
import-analysis pass fails.

SVG works because its generated module is self-contained
(`export default p => <svg …/>`) and has no child imports to resolve.

## Files

- `src/routes/index.tsx` — imports both `image.webp?jsx` (fails) and
  `icon.svg?jsx` (works).
- `repro.mjs` — headless reproduction via the Vite JS API.

## Workaround

Use a `?url` import + a plain `<img>` instead of `?jsx` for raster images:

```tsx
import imageUrl from "../assets/image.webp?url";
// ...
<img src={imageUrl} alt="..." width={200} height={200} />
```
