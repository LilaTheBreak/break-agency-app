// apps/api/src/lib/env.ts

import dotenv from "dotenv";
import path from "path";

// Ensure .env loads BEFORE anything else
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;

  if (!value) {
    console.warn(`[ENV WARNING] Missing environment variable: ${name}`);
  }

  return value || "";
}

// Unified Google OAuth config
export const googleConfig = {
  clientId: getEnv("GOOGLE_CLIENT_ID"),
  clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
  redirectUri: getEnv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:5001/api/auth/google/callback"
  ),
};

console.log(">>> GOOGLE CONFIG LOADED:");
console.log({
  clientId: googleConfig.clientId || "[undefined]",
  clientSecret: googleConfig.clientSecret ? "[loaded]" : "[undefined]",
  redirectUri: googleConfig.redirectUri || "[undefined]",
});
