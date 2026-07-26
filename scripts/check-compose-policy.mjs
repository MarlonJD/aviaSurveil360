#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateComposePolicy } from "./lib/local-compose-policy.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const composePath = path.join(repositoryRoot, "deploy/local/compose.yaml");
const lock = JSON.parse(
  readFileSync(path.join(repositoryRoot, "deploy/local/image-lock.json"), "utf8"),
);
const policy = JSON.parse(
  readFileSync(
    path.join(repositoryRoot, "deploy/local/compose-policy.json"),
    "utf8",
  ),
);

const profiles = process.argv.slice(2);
const selectedProfiles =
  profiles.length > 0 ? profiles : ["demo", "full", "test", "recovery"];
const violations = [];

for (const profile of selectedProfiles) {
  const rendered = execFileSync(
    "docker",
    [
      "compose",
      "--file",
      composePath,
      "--profile",
      profile,
      "config",
      "--format",
      "json",
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  const compose = JSON.parse(rendered);
  for (const violation of validateComposePolicy({ compose, lock, policy })) {
    violations.push({ profile, ...violation });
  }
}

if (violations.length > 0) {
  process.stderr.write(`${JSON.stringify(violations, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Compose policy passed for profiles: ${selectedProfiles.join(", ")}\n`,
  );
}
