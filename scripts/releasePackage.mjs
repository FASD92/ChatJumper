import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(scriptPath, "../..");

export function createZipName(version) {
  return `chatjumper-v${version}.zip`;
}

export function assertMatchingVersions(packageJson, manifestJson) {
  if (packageJson.version !== manifestJson.version) {
    throw new Error(
      `package.json version ${packageJson.version} must match manifest version ${manifestJson.version}`
    );
  }
}

export function assertDistEntries(entries) {
  const required = [
    "manifest.json",
    "background.js",
    "content.js",
    "popup.html",
    "popup.js",
    "options.html",
    "options.js",
    "icons"
  ];

  for (const entry of required) {
    if (!entries.includes(entry)) {
      throw new Error(`dist is missing required release entry: ${entry}`);
    }
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function buildZip() {
  const packageJson = readJson(join(projectRoot, "package.json"));
  const manifestJson = readJson(join(projectRoot, "public/manifest.json"));
  const distDir = join(projectRoot, "dist");
  const artifactsDir = join(projectRoot, "artifacts");

  assertMatchingVersions(packageJson, manifestJson);

  if (!existsSync(distDir)) {
    throw new Error("dist does not exist. Run npm run build before npm run release:zip.");
  }

  assertDistEntries(readdirSync(distDir));
  mkdirSync(artifactsDir, { recursive: true });

  const zipName = createZipName(packageJson.version);
  const zipPath = join(artifactsDir, zipName);

  if (existsSync(zipPath)) {
    rmSync(zipPath);
  }

  const result = spawnSync("zip", ["-r", zipPath, "."], {
    cwd: distDir,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error("Failed to create release zip with the zip command.");
  }

  console.log(`Created ${zipPath}`);
}

if (process.argv[1] === scriptPath) {
  buildZip();
}
