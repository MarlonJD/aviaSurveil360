import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { AppProviders, type ApplicationRuntime } from "./providers";
import { AppRouter } from "./router";
import { ScenarioProvider } from "./scenario-context";
import { registerAppShellServiceWorker } from "../offline/update-coordinator";
import "../styles/app.css";

export function bootstrap(runtime: ApplicationRuntime): void {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("AviaSurveil360 root element is missing");

  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders runtime={runtime}>
        <ScenarioProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </ScenarioProvider>
      </AppProviders>
    </StrictMode>,
  );

  void registerAppShellServiceWorker().catch(() => {
    window.dispatchEvent(new CustomEvent("avia:app-shell-registration-failed"));
  });
}
