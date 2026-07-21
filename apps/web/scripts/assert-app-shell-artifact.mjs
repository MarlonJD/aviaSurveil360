#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function inventory(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.posix.join(prefix, entry.name);
    return entry.isDirectory()
      ? inventory(path.join(directory, entry.name), relativePath)
      : [relativePath];
  });
}

export function assertAppShellArtifact(suppliedPath) {
  const artifactRoot = path.resolve(suppliedPath);
  assert.ok(fs.existsSync(artifactRoot), `App-shell artifact directory is missing: ${artifactRoot}`);
  const files = inventory(artifactRoot);
  for (const required of ["index.html", "sw.js", "app-shell-assets.json"]) {
    assert.ok(files.includes(required), `App-shell artifact is missing ${required}`);
  }

  const manifest = JSON.parse(
    fs.readFileSync(path.join(artifactRoot, "app-shell-assets.json"), "utf8"),
  );
  assert.ok(
    Number.isSafeInteger(manifest.appShellVersion) && manifest.appShellVersion > 0,
    "App-shell version must be a positive integer",
  );
  assert.ok(["demo", "http"].includes(manifest.profile), "App-shell profile must be demo or http");
  assert.ok(Array.isArray(manifest.assets) && manifest.assets.length > 0, "App-shell assets are required");
  for (const asset of manifest.assets) {
    assert.match(asset, /^\/(?:assets\/[A-Za-z0-9_.-]+\.(?:css|js)|demo-build\.json|http-config\.json)$/);
    assert.ok(files.includes(asset.slice(1)), `App-shell manifest asset is missing: ${asset}`);
  }

  const worker = fs.readFileSync(path.join(artifactRoot, "sw.js"), "utf8");
  const marker = `AVIA_APP_SHELL_VERSION:${String(manifest.appShellVersion).padStart(6, "0")}`;
  assert.match(worker, new RegExp(marker), "Service Worker version must match its app-shell manifest");
  for (const forbidden of [
    /skipWaiting/i,
    /clients\.claim/i,
    /caches\.delete/i,
    /stale[-_ ]while[-_ ]revalidate/i,
    /["'`]\/v1(?:\/|["'`])/i,
    /["'`]\/auth(?:\/|["'`])/i,
  ]) {
    assert.doesNotMatch(worker, forbidden, `Service Worker violates the app-shell-only policy: ${forbidden}`);
  }

  return { files: files.length, assets: manifest.assets.length, profile: manifest.profile };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = assertAppShellArtifact(process.argv[2] ?? "dist/demo");
  console.log(
    `app-shell-artifact-scan: ok (${result.profile}, ${result.files} files, ${result.assets} assets)`,
  );
}
