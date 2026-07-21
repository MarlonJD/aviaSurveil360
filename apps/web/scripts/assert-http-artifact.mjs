#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { assertAppShellArtifact } from "./assert-app-shell-artifact.mjs";

const suppliedPath = path.resolve(process.argv[2] ?? "dist");
const artifactRoot = fs.existsSync(path.join(suppliedPath, "http"))
  ? path.join(suppliedPath, "http")
  : suppliedPath;

assert.ok(fs.existsSync(artifactRoot), `HTTP artifact directory is missing: ${artifactRoot}`);
assertAppShellArtifact(artifactRoot);

function readJson(relativePath) {
  const filePath = path.join(artifactRoot, relativePath);
  assert.ok(fs.existsSync(filePath), `HTTP artifact file is missing: ${relativePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function inventory(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.posix.join(prefix, entry.name);
    return entry.isDirectory()
      ? inventory(path.join(directory, entry.name), relativePath)
      : [relativePath];
  });
}

const buildInputs = readJson("build-inputs.json");
assert.equal(buildInputs.profile, "http", "Artifact input inventory must identify the HTTP profile");
assert.ok(Array.isArray(buildInputs.inputs), "Artifact input inventory must list module inputs");

const forbiddenSourcePatterns = [
  /[/\\]src[/\\]mock[/\\]/i,
  /[/\\]seed-data\.[cm]?[jt]s$/i,
  /[/\\]create-mock-backend\.[cm]?[jt]s$/i,
  /[/\\]mock-engine\.[cm]?[jt]s$/i,
  /[/\\]memory-mock-store\.[cm]?[jt]s$/i,
];

for (const input of buildInputs.inputs) {
  for (const forbidden of forbiddenSourcePatterns) {
    assert.doesNotMatch(input, forbidden, `HTTP artifact imported forbidden mock input: ${input}`);
  }
}

const files = inventory(artifactRoot);
for (const forbiddenFile of ["demo-build.json", "demo-config.json", "seed-data.json"]) {
  assert.ok(!files.includes(forbiddenFile), `HTTP artifact contains ${forbiddenFile}`);
}
assert.ok(files.includes("http-config.json"), "HTTP artifact must contain its allowlisted public config");
assert.ok(files.includes(".vite/manifest.json"), "HTTP artifact must contain a Vite manifest");

const publicConfig = readJson("http-config.json");
assert.deepEqual(Object.keys(publicConfig).sort(), ["apiBaseUrl", "environmentLabel"]);
assert.ok(!Object.keys(publicConfig).some((key) => /backend|mode|token|secret|password/i.test(key)));

const manifestSource = JSON.stringify(readJson(".vite/manifest.json"));
assert.doesNotMatch(manifestSource, /src\/mock|seed-data|create-mock-backend/i);

const forbiddenArtifactPatterns = [
  /x-avia-test-token/i,
  /x-avia-test-subject/i,
  /candidate-canonical-test-token/i,
  /src\/test-profile/i,
];
for (const relativePath of files.filter((file) => /\.(?:js|map)$/.test(file))) {
  const contents = fs.readFileSync(path.join(artifactRoot, relativePath), "utf8");
  for (const forbidden of forbiddenArtifactPatterns) {
    assert.doesNotMatch(
      contents,
      forbidden,
      `HTTP artifact contains local canonical-test boundary data in ${relativePath}`,
    );
  }
}

console.log(`http-artifact-scan: ok (${files.length} files, ${buildInputs.inputs.length} inputs)`);
