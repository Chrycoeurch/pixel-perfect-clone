import { execSync } from "child_process";
import { cpSync, copyFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const root = new URL(".", import.meta.url).pathname;
const dist = join(root, "dist");
const clientDir = join(dist, "client");
const serverDir = join(dist, "server");

console.log("📦 Building…");
execSync("npm run build", { stdio: "inherit" });

// Copier server.js à la racine de dist/client/
console.log("🔧 Copying server.js to client root…");
copyFileSync(join(serverDir, "server.js"), join(clientDir, "server.js"));
copyFileSync(join(serverDir, "server.js"), join(clientDir, "_worker.js"));

// Copier les assets serveur dans dist/client/assets/
const serverAssetsDir = join(serverDir, "assets");
const clientAssetsDir = join(clientDir, "assets");
if (existsSync(serverAssetsDir)) {
  cpSync(serverAssetsDir, clientAssetsDir, { recursive: true, force: true });
  console.log("✅ Server assets copied to client/assets/");
}

// Créer _routes.json pour que Cloudflare serve les assets statiques directement
// et envoie uniquement les routes SSR au worker
const routes = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/assets/*",
    "/favicon.ico",
    "/robots.txt",
  ],
};
writeFileSync(join(clientDir, "_routes.json"), JSON.stringify(routes, null, 2));
console.log("✅ _routes.json created");

console.log("✅ Build complete → dist/client/");
