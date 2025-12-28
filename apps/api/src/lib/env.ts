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

// Production credential validation
export function validateProductionCredentials(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for test/placeholder credentials
  if (!googleConfig.clientId || googleConfig.clientId === "test") {
    errors.push("GOOGLE_CLIENT_ID is missing or set to 'test'");
  }
  
  if (!googleConfig.clientSecret || googleConfig.clientSecret === "test") {
    errors.push("GOOGLE_CLIENT_SECRET is missing or set to 'test'");
  }
  
  if (!googleConfig.redirectUri) {
    errors.push("GOOGLE_REDIRECT_URI is missing");
  }
  
  // Warn about localhost in production
  if (process.env.NODE_ENV === "production" && googleConfig.redirectUri.includes("localhost")) {
    errors.push("GOOGLE_REDIRECT_URI contains 'localhost' in production environment");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

