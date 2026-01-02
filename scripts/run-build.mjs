// scripts/run-build.mjs
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const run = (cmd, opts = {}) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
};

const isVercel = process.env.VERCEL === "1";

// On Vercel: build ONLY the frontend (apps/web)
// On Railway/Local: build the entire workspace (shared, api, web)
if (isVercel) {
  // Deps are already installed by Vercel's Install Command at the workspace root
  // Just build the web app
  run("pnpm -C apps/web build");
} else {
  // Railway/local: full monorepo build (shared → api → web)
  run("pnpm install --frozen-lockfile");
  run("pnpm -r build");
}
