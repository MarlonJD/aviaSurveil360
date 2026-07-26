export type TelemetryRedactionClass = "public" | "operational" | "restricted" | "";

export interface BrowserTelemetrySignal {
  name: string;
  kind: "span" | "metric" | "log";
  owner: string;
  unit: string;
  redactionClass: TelemetryRedactionClass;
  allowedAttributes: string[];
}

export interface BrowserTelemetryContract {
  resourceAttributes: string[];
  signals: BrowserTelemetrySignal[];
}

const forbiddenAttributeFragments = [
  "password",
  "token",
  "cookie",
  "evidence.bytes",
  "message.body",
  "internal_caa_note",
];

const unboundedIdentity = /(^|\.)(user|subject|entity|record|finding|audit)\.?id$/;

export function browserTelemetryContract(): BrowserTelemetryContract {
  return {
    resourceAttributes: [
      "service.name",
      "service.version",
      "deployment.environment.name",
      "build.profile",
    ],
    signals: [
      {
        name: "browser.route.navigation",
        kind: "span",
        owner: "Frontend",
        unit: "navigation",
        redactionClass: "operational",
        allowedAttributes: ["route.id", "build.profile", "navigation.type", "outcome.class", "correlation.id"],
      },
      {
        name: "browser.web_vital",
        kind: "metric",
        owner: "Frontend",
        unit: "{web_vital}",
        redactionClass: "operational",
        allowedAttributes: ["route.id", "build.profile", "web_vital.name", "rating"],
      },
      {
        name: "browser.api.outcome",
        kind: "metric",
        owner: "Frontend",
        unit: "request",
        redactionClass: "operational",
        allowedAttributes: ["route.id", "build.profile", "operation.class", "outcome.class"],
      },
      {
        name: "browser.error.handled",
        kind: "log",
        owner: "Frontend",
        unit: "event",
        redactionClass: "restricted",
        allowedAttributes: ["route.id", "build.profile", "error.class", "outcome.class", "correlation.id"],
      },
    ],
  };
}

function forbiddenAttribute(attribute: string): boolean {
  const normalized = attribute.trim().toLowerCase();
  return (
    forbiddenAttributeFragments.some((fragment) => normalized.includes(fragment)) ||
    unboundedIdentity.test(normalized)
  );
}

export function validateBrowserTelemetryContract(
  contract: BrowserTelemetryContract,
): string[] {
  const errors: string[] = [];
  for (const signal of contract.signals) {
    if (signal.owner.trim() === "") {
      errors.push(`${signal.name}: owner is required`);
    }
    if (signal.redactionClass === "") {
      errors.push(`${signal.name}: redaction class is required`);
    }
    for (const attribute of signal.allowedAttributes) {
      if (forbiddenAttribute(attribute)) {
        errors.push(`${signal.name}: forbidden attribute ${attribute}`);
      }
    }
  }
  return errors.sort();
}
