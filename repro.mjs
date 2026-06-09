// Headless reproduction — no browser needed.
//
// Spins up a Vite dev server with the Qwik plugins and transforms the virtual
// module that a `image.webp?jsx` import expands into, in BOTH Vite environments.
//
//   - ssr    environment: transform SUCCEEDS
//   - client environment: transform FAILS ("Failed to resolve import ...")
//
// The child imports of the generated module resolve fine on their own in both
// environments (printed below), so the failure is specific to the full
// client-environment import-analysis pass.
//
//   node repro.mjs
import { createServer } from "vite";
import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";

const cwd = process.cwd();
const VIRT = "virtual:" + cwd + "/src/assets/image.webp.qwik.jsx?jsx=";
const INNER = cwd + "/src/assets/image.webp?jsx=&qwik-asset-jsx=";
const TOIMG = "@to-img.qwik.jsx";

const server = await createServer({
  configFile: false,
  mode: "ssr",
  logLevel: "silent",
  server: { middlewareMode: true, hmr: false },
  plugins: [qwikRouter(), qwikVite()],
});

let failed = false;
for (const name of ["ssr", "client"]) {
  const env = server.environments[name];
  console.log(`\n=== ${name} environment ===`);

  for (const [label, id] of [["inner image", INNER], ["@to-img", TOIMG]]) {
    const r = await env.pluginContainer.resolveId(id, VIRT);
    console.log(`  resolveId(${label}) -> ${r ? r.id : "null"}`);
  }

  try {
    const t = await env.transformRequest(VIRT);
    console.log(`  transformRequest(virtual jsx module) -> OK (len=${t?.code?.length})`);
  } catch (e) {
    failed = true;
    console.log(`  transformRequest(virtual jsx module) -> FAIL: ${e.message.split("\n")[0]}`);
  }
}

await server.close();
console.log(
  failed
    ? "\nBUG REPRODUCED: client-environment transform failed while ssr succeeded."
    : "\nNo failure — bug appears fixed in these versions.",
);
process.exit(failed ? 1 : 0);
