import { Component, type ErrorInfo, type ReactNode } from "react";

import type { BrowserTelemetry } from "./browser-telemetry";

interface BrowserTelemetryErrorBoundaryProps {
  children: ReactNode;
  telemetry: BrowserTelemetry;
  routeID: () => string;
}

interface BrowserTelemetryErrorBoundaryState {
  failed: boolean;
}

export class BrowserTelemetryErrorBoundary extends Component<
  BrowserTelemetryErrorBoundaryProps,
  BrowserTelemetryErrorBoundaryState
> {
  state: BrowserTelemetryErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): BrowserTelemetryErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, _information: ErrorInfo): void {
    this.props.telemetry.recordHandledError(error, this.props.routeID());
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <main role="alert">
          <h1>The application view could not be displayed.</h1>
          <p>Reload the page. If the problem continues, contact platform support.</p>
        </main>
      );
    }
    return this.props.children;
  }
}
