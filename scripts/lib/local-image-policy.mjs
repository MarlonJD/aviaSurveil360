import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const digestPattern = /^sha256:[a-f0-9]{64}$/u;

function violation(code, subject, message) {
  return { code, subject, message };
}

export function validateImageEvidence(evidence) {
  const violations = [];
  for (const [imageName, image] of Object.entries(evidence.images ?? {})) {
    if (!digestPattern.test(image.digest ?? "")) {
      violations.push(
        violation(
          "INVALID_IMAGE_DIGEST",
          imageName,
          "built image digest must be sha256",
        ),
      );
      continue;
    }
    const sbom = evidence.sboms?.[imageName];
    if (!sbom) {
      violations.push(
        violation("MISSING_SBOM", imageName, "CycloneDX SBOM is absent"),
      );
    } else if (
      sbom.digest !== image.digest ||
      sbom.format !== "cyclonedx-json"
    ) {
      violations.push(
        violation(
          "SBOM_DIGEST_MISMATCH",
          imageName,
          "SBOM is not bound to the built digest",
        ),
      );
    }
    const scan = evidence.scans?.[imageName];
    if (!scan || scan.digest !== image.digest) {
      violations.push(
        violation(
          "UNSCANNED_DIGEST",
          imageName,
          "the built digest has no matching vulnerability scan",
        ),
      );
    } else if (scan.status !== "passed") {
      violations.push(
        violation(
          "UNAPPROVED_FINDINGS",
          imageName,
          "HIGH or CRITICAL findings remain unresolved",
        ),
      );
    }
  }
  return violations;
}

export function validateVulnerabilityPolicy(
  policy,
  { today = new Date().toISOString().slice(0, 10) } = {},
) {
  const violations = [];
  if (policy.schemaVersion !== 1) {
    violations.push(
      violation("INVALID_POLICY_VERSION", "policy", "schemaVersion must be 1"),
    );
  }
  const severities = new Set(policy.failSeverities ?? []);
  if (!severities.has("HIGH") || !severities.has("CRITICAL")) {
    violations.push(
      violation(
        "WEAK_SEVERITY_POLICY",
        "policy",
        "HIGH and CRITICAL must both fail closed",
      ),
    );
  }
  for (const [index, exception] of (policy.exceptions ?? []).entries()) {
    const subject = exception.vulnerabilityId || `exception-${index}`;
    if (!exception.image || !digestPattern.test(exception.digest ?? "")) {
      violations.push(
        violation(
          "INVALID_EXCEPTION_IMAGE",
          subject,
          "exception requires an image and exact sha256 digest",
        ),
      );
    }
    if (!exception.vulnerabilityId) {
      violations.push(
        violation(
          "MISSING_EXCEPTION_ID",
          subject,
          "exception requires a vulnerability identifier",
        ),
      );
    }
    if (!exception.owner?.trim()) {
      violations.push(
        violation(
          "MISSING_EXCEPTION_OWNER",
          subject,
          "exception owner is required",
        ),
      );
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/u.test(exception.expiresOn ?? "") ||
      exception.expiresOn < today
    ) {
      violations.push(
        violation(
          "EXPIRED_EXCEPTION",
          subject,
          "exception expiry must be today or later",
        ),
      );
    }
    if ((exception.rationale?.trim().length ?? 0) < 24) {
      violations.push(
        violation(
          "MISSING_EXCEPTION_RATIONALE",
          subject,
          "exception rationale must contain at least 24 characters",
        ),
      );
    }
    if (
      !/^(?:https:\/\/|docs\/exec-plans\/tech-debt-tracker\.md#)/u.test(
        exception.tracker ?? "",
      )
    ) {
      violations.push(
        violation(
          "MISSING_EXCEPTION_TRACKER",
          subject,
          "exception requires a durable tracker URL or debt anchor",
        ),
      );
    }
  }
  return violations;
}

export function exceptionIDsForImage(policy, imageName, digest, options) {
  const {
    additionalDigests = [],
    ...validationOptions
  } = options ?? {};
  const violations = validateVulnerabilityPolicy(policy, validationOptions);
  if (violations.length > 0) {
    throw new Error(JSON.stringify(violations));
  }
  const acceptedDigests = new Set([digest, ...additionalDigests]);
  return (policy.exceptions ?? [])
    .filter(
      (exception) =>
        exception.image === imageName &&
        acceptedDigests.has(exception.digest),
    )
    .map((exception) => exception.vulnerabilityId)
    .sort();
}

function loadJSON(filename) {
  return JSON.parse(readFileSync(filename, "utf8"));
}

function printViolations(violations) {
  for (const entry of violations) {
    process.stderr.write(
      `${entry.code}: ${entry.subject}: ${entry.message}\n`,
    );
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [
    command,
    filename,
    imageName,
    digest,
    ...additionalDigests
  ] = process.argv.slice(2);
  if (command === "validate-vulnerability-policy" && filename) {
    const violations = validateVulnerabilityPolicy(loadJSON(filename));
    printViolations(violations);
    if (violations.length > 0) process.exitCode = 1;
  } else if (command === "validate-image-evidence" && filename) {
    const violations = validateImageEvidence(loadJSON(filename));
    printViolations(violations);
    if (violations.length > 0) process.exitCode = 1;
  } else if (
    command === "exception-ids" &&
    filename &&
    imageName &&
    digest
  ) {
    for (const vulnerabilityID of exceptionIDsForImage(
      loadJSON(filename),
      imageName,
      digest,
      { additionalDigests },
    )) {
      process.stdout.write(`${vulnerabilityID}\n`);
    }
  } else {
    process.stderr.write(
      "usage: local-image-policy.mjs <validate-vulnerability-policy|validate-image-evidence|exception-ids> <file> [image digest]\n",
    );
    process.exitCode = 64;
  }
}
