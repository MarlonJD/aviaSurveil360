import { bootstrap } from "../app/bootstrap";
import { readPublicHttpConfig } from "../app/public-http-config";
import { createHttpBackend } from "../backend/http-backend";

async function start(): Promise<void> {
  const config = await readPublicHttpConfig();
  bootstrap({
    backend: createHttpBackend(config),
    buildProfile: "http",
    environmentLabel: config.environmentLabel,
  });
}

void start();
