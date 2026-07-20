export type BuildProfile = "demo" | "http";

export function resolveBuildProfile(
  value: string | undefined,
  testEnvironment = false,
): BuildProfile {
  if (value === undefined && testEnvironment) return "demo";
  if (value === "demo" || value === "http") return value;
  throw new Error("AVIA_BUILD_PROFILE must be exactly 'demo' or 'http'");
}
