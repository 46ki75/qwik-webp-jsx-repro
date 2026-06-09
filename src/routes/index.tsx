import { component$ } from "@qwik.dev/core";

// ❌ Raster image `?jsx` import — breaks in the client environment.
//    Comment this out (and its usage below) and the page loads fine.
import ImgRaster from "../assets/image.webp?jsx";

// ✅ SVG `?jsx` import — works. Included to show the contrast.
import ImgSvg from "../assets/icon.svg?jsx";

export default component$(() => {
  return (
    <main>
      <h1>Qwik v2 raster `?jsx` repro</h1>
      <ImgRaster alt="raster" />
      <ImgSvg />
    </main>
  );
});
