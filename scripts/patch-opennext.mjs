#!/usr/bin/env node
/**
 * Patches @opennextjs/cloudflare's esbuild bundle to alias heavy
 * client-only Cardano/Lightning/Spark packages to empty stubs.
 *
 * Without this, OpenNext bundles ~25 MB of Lightning/gRPC/Spark code
 * (pulled in transitively via @meshsdk/react -> @utxos/sdk ->
 * @buildonspark/spark-sdk) into the server handler, blowing past
 * Cloudflare's 10 MiB Worker limit. These packages are only used from
 * "use client" components and never run server-side, so stubbing them
 * out is safe.
 *
 * Run before `opennextjs-cloudflare build`. Safe to run repeatedly —
 * detects whether the patch is already applied.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const target = path.resolve(
  "node_modules/@opennextjs/cloudflare/dist/cli/build/bundle-server.js",
);

const MARKER = "// triphunt-frontend: stub heavy Cardano/Lightning packages";

const SHIM_ALIASES = `
            ${MARKER}
            "@buildonspark/spark-sdk": path.join(buildOpts.outputDir, "cloudflare-templates/shims/empty.js"),
            "@buildonspark/issuer-sdk": path.join(buildOpts.outputDir, "cloudflare-templates/shims/empty.js"),
            "@utxos/sdk": path.join(buildOpts.outputDir, "cloudflare-templates/shims/empty.js"),
            "@lightsparkdev/core": path.join(buildOpts.outputDir, "cloudflare-templates/shims/empty.js"),
            "@meshsdk/core": path.join(buildOpts.outputDir, "cloudflare-templates/shims/empty.js"),
            "@meshsdk/core-cst": path.join(buildOpts.outputDir, "cloudflare-templates/shims/empty.js"),
            "@meshsdk/react": path.join(buildOpts.outputDir, "cloudflare-templates/shims/empty.js"),`;

let src;
try {
  src = await readFile(target, "utf8");
} catch (err) {
  console.error(`patch-opennext: ${target} not found — run \`npm install\` first.`);
  process.exit(1);
}

if (src.includes(MARKER)) {
  console.log("patch-opennext: already applied, skipping.");
  process.exit(0);
}

// Insert our aliases just before the closing brace of the alias object.
// The alias object ends with `"@next/env": ...`. Find that and inject after.
const insertAfter = `"@next/env": path.join(buildOpts.outputDir, "cloudflare-templates/shims/env.js"),`;
if (!src.includes(insertAfter)) {
  console.error(
    "patch-opennext: anchor `\"@next/env\":` not found in bundle-server.js — OpenNext layout has changed.",
  );
  process.exit(1);
}

const patched = src.replace(insertAfter, insertAfter + SHIM_ALIASES);
await writeFile(target, patched);
console.log("patch-opennext: applied stub aliases for client-only packages.");
