/**
 * Script de build pour Cloudflare Pages.
 * Le _worker.js dans dist/client/ référence ../server.js
 * donc on copie tout le contenu de dist/server/ dans dist/client/
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

// 2. Copier server.js → dist/client/server.js
//    (le _worker.js l'importe via "../server.js" depuis assets/)
console.log("🔧 Copying server.js to client root…");
copyFileSync(join(serverDir, "server.js"), join(clientDir, "server.js"));

// 3. Copier _worker.js = server.js (entry point Cloudflare Pages)
copyFileSync(join(serverDir, "server.js"), join(clientDir, "_worker.js"));

// 4. Copier les assets serveur dans dist/client/assets/
const serverAssetsDir = join(serverDir, "assets");
const clientAssetsDir = join(clientDir, "assets");
if (existsSync(serverAssetsDir)) {
  cpSync(serverAssetsDir, clientAssetsDir, { recursive: true, force: true });
  console.log("✅ Server assets copied to client/assets/");
}

console.log("✅ Build complete → dist/client/");
