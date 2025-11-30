import { safeEnv } from "../utils/safeEnv.js";

export function requireEnv(name: string, fallback?: string): string {
  const value = safeEnv(name, fallback ?? `dev-${name.toLowerCase()}`);
  return value;
}
