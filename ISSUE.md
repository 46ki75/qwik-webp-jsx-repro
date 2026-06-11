# [🐞] Raster image `?jsx` import fails to resolve in the client environment (v2 beta)

## Which component is affected?

Qwik Router (`@qwik.dev/router`)

## Describe the bug

Importing a **raster** image (`.webp`, `.png`, `.jpg`, …) with the `?jsx`
suffix throws a Vite resolve error during dev, but only in the **client**
build environment:

```text
Failed to resolve import
"virtual:/…/src/assets/image.webp.qwik.jsx?jsx="
from "virtual:/…/src/assets/image.webp.qwik.jsx?jsx=". Does the file exist?
```

The page shows the Vite error overlay. **SVG** `?jsx` imports are unaffected
and render fine.

### What seems to happen

A `image.webp?jsx` import is expanded by the `qwik-router-image-jsx` plugin
into a virtual module:

```js
// virtual:/…/image.webp.qwik.jsx?jsx=
import { srcSet, width, height } from "/…/image.webp?jsx=&qwik-asset-jsx=";
import toImg from "@to-img.qwik.jsx";
export default toImg(srcSet, width, height);
```

Both child imports resolve correctly when `pluginContainer.resolveId()` is
called on them directly, and the **ssr** environment transforms the virtual
module fine. Only the full **client**-environment import-analysis pass fails —
the error message names the virtual module as its own importer.

SVG works because its generated module is self-contained
(`export default (p) => <svg …/>`) and has no child imports to resolve.

## Reproduction

https://github.com/46ki75/qwik-webp-jsx-repro

(Also runs on StackBlitz without local setup:
https://stackblitz.com/github/46ki75/qwik-webp-jsx-repro — the bug fires
during Vite import-analysis, before `sharp` is ever invoked, so WebContainers'
lack of native binaries doesn't matter.)

## Steps to reproduce

```bash
pnpm install

# Option A — headless, deterministic (Vite JS API, exits non-zero on the bug):
pnpm repro
#   === ssr environment ===    transformRequest -> OK
#   === client environment === transformRequest -> FAIL: Failed to resolve import …

# Option B — real dev server:
pnpm dev
# open the printed URL → Vite error overlay with the message above
```

The route is minimal:

```tsx
import ImgRaster from "../assets/image.webp?jsx"; // ❌ fails
import ImgSvg from "../assets/icon.svg?jsx";      // ✅ works
```

## Expected behavior

`image.webp?jsx` produces a working `<img>` component in both environments,
as documented for image `?jsx` imports.

## System info

| package            | version                                    |
| ------------------ | ------------------------------------------ |
| `@qwik.dev/core`   | `2.0.0-beta.37`                            |
| `@qwik.dev/router` | `2.0.0-beta.37`                            |
| `vite`             | `7.3.2`                                    |
| node               | `^20.19 \|\| >=22.12` (Vite 7 requirement) |
| OS                 | Linux (WSL2) — also reproduces on StackBlitz WebContainers |

## Workaround

Use a `?url` import with a plain `<img>` for raster images:

```tsx
import imageUrl from "../assets/image.webp?url";
// ...
<img src={imageUrl} alt="..." width={200} height={200} />
```
