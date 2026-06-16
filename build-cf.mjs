/**
 * Script de build pour Cloudflare Pages.
 * Lance le build Vite puis copie server.js → dist/client/_worker.js
 * et les assets serveur dans dist/client/assets/
 */
import { execSync } from "child_process";
import { cpSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const root = new URL(".", import.meta.url).pathname;
const dist = join(root, "dist");
const clientDir = join(dist, "client");
const serverDir = join(dist, "server");

// 1. Build Vite
console.log("📦 Building…");
execSync("npm run build", { stdio: "inherit" });

// 2. Copier server.js → dist/client/_worker.js (Cloudflare Pages entry)
console.log("🔧 Copying server worker…");
copyFileSync(join(serverDir, "server.js"), join(clientDir, "_worker.js"));

// 3. Copier les assets server (chunks SSR référencés dynamiquement)
const serverAssetsDir = join(serverDir, "assets");
const clientAssetsDir = join(clientDir, "assets");
if (existsSync(serverAssetsDir)) {
  cpSync(serverAssetsDir, clientAssetsDir, { recursive: true, force: false });
  console.log("✅ Server assets copied to client/assets/");
}

console.log("✅ Build complete → dist/client/");
