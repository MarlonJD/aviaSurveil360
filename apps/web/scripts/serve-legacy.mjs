#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(scriptDir, "../../..");
const defaultHost = "127.0.0.1";
const defaultPort = 4173;

const allowedRootFiles = new Set([
  "index.html",
  "css/styles.css",
  "js/data.js",
  "js/helpers.js",
  "js/approval.js",
  "js/planning.js",
  "js/checklists.js",
  "js/inspection.js",
  "js/reports.js",
  "js/manager-workspaces.js",
  "js/work-items.js",
  "js/views.js",
  "js/app.js",
  "assets/fonts/dm-sans/DMSans-Variable.ttf",
  "assets/login/airspace-texture.png",
  "assets/login/aviasurveil360-mark.png",
  "assets/icons/phosphor/air-traffic-control.svg",
  "assets/icons/phosphor/arrow-right.svg",
  "assets/icons/phosphor/bank.svg",
  "assets/icons/phosphor/buildings.svg",
  "assets/icons/phosphor/compass.svg",
  "assets/icons/phosphor/gear.svg",
  "assets/icons/phosphor/globe-hemisphere-west.svg",
  "assets/icons/phosphor/seal-check.svg",
  "assets/icons/phosphor/wallet.svg",
]);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
]);

export function legacyContentType(pathname) {
  return contentTypes.get(extname(pathname)) ?? "application/octet-stream";
}

function resolveAllowedPath(requestUrl) {
  const parsed = new URL(requestUrl, `http://${defaultHost}:${defaultPort}`);
  const pathname = decodeURIComponent(parsed.pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const normalized = normalize(relativePath).split(sep).join("/");
  if (!allowedRootFiles.has(normalized)) return null;
  const absolute = resolve(repoRoot, normalized);
  const relativeToRoot = absolute.startsWith(repoRoot + sep);
  if (!relativeToRoot && absolute !== repoRoot) return null;
  return { absolute, normalized };
}

export function startLegacyServer(options = {}) {
  const host = options.host ?? defaultHost;
  const port = options.port ?? defaultPort;
  const server = createServer((request, response) => {
    if (!request.url) {
      response.writeHead(400).end("Bad request");
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
      return;
    }

    const resolved = resolveAllowedPath(request.url);
    if (!resolved || !existsSync(resolved.absolute) || !statSync(resolved.absolute).isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": legacyContentType(resolved.normalized),
      "X-AviaSurveil360-Legacy-Oracle": "read-only",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(resolved.absolute).pipe(response);
  });

  return new Promise((resolveStart, rejectStart) => {
    const onError = (error) => {
      server.off("listening", onListening);
      rejectStart(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolveStart({
        server,
        url: `http://${host}:${port}`,
        close: () => new Promise((resolveClose, rejectClose) => {
          server.close((error) => {
            if (error) rejectClose(error);
            else resolveClose();
          });
        }),
      });
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const portArg = process.env.PORT ? Number(process.env.PORT) : defaultPort;
  const serverHandle = await startLegacyServer({ host: defaultHost, port: portArg });
  process.stdout.write(`Legacy oracle server listening at ${serverHandle.url}\n`);
  const shutdown = async () => {
    await serverHandle.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
