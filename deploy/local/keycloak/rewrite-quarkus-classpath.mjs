import {
  readFileSync,
  writeFileSync,
} from "node:fs";

function replaceAll(content, before, after) {
  if (before.length !== after.length) {
    throw new Error("replacement byte length must match");
  }
  let replacements = 0;
  let offset = 0;
  while (offset < content.length) {
    const index = content.indexOf(before, offset);
    if (index === -1) {
      break;
    }
    after.copy(content, index);
    replacements += 1;
    offset = index + after.length;
  }
  return replacements;
}

const [manifestPath, ...metadataPaths] = process.argv.slice(2);
if (!manifestPath || metadataPaths.length === 0) {
  throw new Error(
    "usage: rewrite-quarkus-classpath.mjs <manifest.json> <metadata>...",
  );
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.patches)) {
  throw new Error("invalid Keycloak runtime patch manifest");
}

const replacementCounts = new Map(
  manifest.patches.map((patch) => [patch.classpath, 0]),
);
for (const metadataPath of metadataPaths) {
  const content = readFileSync(metadataPath);
  for (const patch of manifest.patches) {
    const before = Buffer.from(patch.classpath, "utf8");
    const after = Buffer.from(patch.output, "utf8");
    const count = replaceAll(content, before, after);
    replacementCounts.set(
      patch.classpath,
      replacementCounts.get(patch.classpath) + count,
    );
  }
  writeFileSync(metadataPath, content);
}

for (const [classpathPath, count] of replacementCounts) {
  if (count === 0) {
    throw new Error(`missing Quarkus classpath entry: ${classpathPath}`);
  }
}
