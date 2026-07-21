import type { BuildProfile } from "./build-profile";

export function contentSecurityPolicy(profile: BuildProfile, localDevelopment: boolean): string {
  const scripts = ["'self'"];
  const styles = ["'self'"];
  const connections = ["'self'"];
  if (profile === "http" && !localDevelopment) connections.push("https:");
  if (localDevelopment) {
    scripts.push("'unsafe-inline'");
    styles.push("'unsafe-inline'");
    connections.push("http://127.0.0.1:*", "ws://127.0.0.1:*");
  }
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    `script-src ${scripts.join(" ")}`,
    `style-src ${styles.join(" ")}`,
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connections.join(" ")}`,
    "worker-src 'self'",
    "manifest-src 'self'",
  ].join("; ");
}
