import {
  createHash,
  timingSafeEqual,
} from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import https from "node:https";
import path from "node:path";

const allowedHosts = new Set([
  "jdbc.postgresql.org",
  "repo.maven.apache.org",
]);
const maximumArtifactBytes = 100 * 1024 * 1024;
const maximumRedirects = 3;

function download(url, redirectsRemaining = maximumRedirects) {
  const parsedURL = new URL(url);
  if (
    parsedURL.protocol !== "https:" ||
    !allowedHosts.has(parsedURL.hostname)
  ) {
    throw new Error(`unapproved Keycloak patch URL: ${url}`);
  }

  return new Promise((resolve, reject) => {
    const request = https.get(
      parsedURL,
      {
        headers: {
          "user-agent": "aviasurveil360-keycloak-patch-builder/1",
        },
      },
      (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          if (redirectsRemaining === 0) {
            reject(new Error(`too many redirects for ${url}`));
            return;
          }
          const redirectURL = new URL(response.headers.location, parsedURL);
          resolve(download(redirectURL.href, redirectsRemaining - 1));
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(
            new Error(
              `Keycloak patch download returned ${response.statusCode} for ${url}`,
            ),
          );
          return;
        }

        const chunks = [];
        let totalBytes = 0;
        response.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > maximumArtifactBytes) {
            response.destroy(
              new Error(`Keycloak patch exceeded size limit: ${url}`),
            );
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      },
    );
    request.on("error", reject);
  });
}

const [manifestPath, outputDirectory] = process.argv.slice(2);
if (!manifestPath || !outputDirectory) {
  throw new Error(
    "usage: download-runtime-patches.mjs <manifest.json> <output-directory>",
  );
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.patches)) {
  throw new Error("invalid Keycloak runtime patch manifest");
}
mkdirSync(outputDirectory, { recursive: true, mode: 0o755 });

for (const patch of manifest.patches) {
  if (
    !/^[A-Za-z0-9._-]+\.jar$/u.test(patch.output ?? "") ||
    !/^[A-Za-z0-9._-]+\.jar$/u.test(patch.classpath ?? "") ||
    !/^[a-f0-9]{64}$/u.test(patch.sha256 ?? "")
  ) {
    throw new Error("invalid Keycloak runtime patch entry");
  }
  const artifact = await download(patch.url);
  const actualDigest = createHash("sha256").update(artifact).digest();
  const expectedDigest = Buffer.from(patch.sha256, "hex");
  if (
    expectedDigest.length !== actualDigest.length ||
    !timingSafeEqual(expectedDigest, actualDigest)
  ) {
    throw new Error(`checksum mismatch for ${patch.output}`);
  }
  writeFileSync(path.join(outputDirectory, patch.output), artifact, {
    mode: 0o444,
  });
}
