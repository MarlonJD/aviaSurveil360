import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { resolveBuildProfile, type BuildProfile } from "./src/app/build-profile";

function buildProfilePlugin(profile: BuildProfile): Plugin {
  return {
    name: "aviasurveil360-build-profile",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace("__AVIA_ENTRY__", profile);
      },
    },
    generateBundle(_options, bundle) {
      const inputs = new Set<string>();
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        for (const moduleId of Object.keys(output.modules)) inputs.add(moduleId);
      }
      this.emitFile({
        type: "asset",
        fileName: "build-inputs.json",
        source: `${JSON.stringify({ profile, inputs: [...inputs].sort() }, null, 2)}\n`,
      });
    },
  };
}

export default defineConfig(() => {
  const profile = resolveBuildProfile(process.env.AVIA_BUILD_PROFILE, Boolean(process.env.VITEST));

  return {
    plugins: [react(), buildProfilePlugin(profile)],
    publicDir: `public/${profile}`,
    define: {
      __AVIA_BUILD_PROFILE__: JSON.stringify(profile),
    },
    build: {
      outDir: `dist/${profile}`,
      emptyOutDir: true,
      manifest: true,
      sourcemap: true,
    },
    test: {
      environment: "node",
      exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
      restoreMocks: true,
    },
  };
});
