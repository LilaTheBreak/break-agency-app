// apps/api/src/lib/env.ts

import dotenv from "dotenv";
import path from "path";

// Ensure .env loads BEFORE anything else (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
  });
}

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;

  if (!value) {
    console.warn(`[ENV WARNING] Missing environment variable: ${name}`);
  }

  return value || "";
}

function getEnvRequired(name: string, productionOnly: boolean = true): string {
  const value = process.env[name];
  
  if (!value && (productionOnly ? process.env.NODE_ENV === 'production' : true)) {
    throw new Error(`REQUIRED: ${name} environment variable is not set. Cannot start in ${process.env.NODE_ENV || 'unknown'} mode.`);
  }
  
  return value || "";
}

// Unified Google OAuth config
const redirectUri = process.env.NODE_ENV === 'production'
  ? getEnvRequired('GOOGLE_REDIRECT_URI')
  : process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/auth/google/callback';

export const googleConfig = {
  clientId: getEnv("GOOGLE_CLIENT_ID"),
  clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
  redirectUri: redirectUri,
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
  
  // Placeholder patterns that indicate invalid credentials
  const placeholderPatterns = [
    "test",
    "your-google-client-id",
    "your-google-client-secret",
    "xxxxxx",
    "placeholder",
    "example",
    "undefined",
    ""
  ];
  
  // Check for test/placeholder credentials - STRICT validation
  const normalizedClientId = (googleConfig.clientId || "").toLowerCase().trim();
  const normalizedClientSecret = (googleConfig.clientSecret || "").toLowerCase().trim();
  const normalizedRedirectUri = (googleConfig.redirectUri || "").toLowerCase().trim();
  
  if (!googleConfig.clientId || 
      placeholderPatterns.some(p => normalizedClientId === p.toLowerCase())) {
    errors.push("GOOGLE_CLIENT_ID is missing or set to a placeholder value (must be a real Google OAuth 2.0 Client ID)");
  }
  
  if (!googleConfig.clientSecret || 
      placeholderPatterns.some(p => normalizedClientSecret === p.toLowerCase())) {
    errors.push("GOOGLE_CLIENT_SECRET is missing or set to a placeholder value (must be a real Google OAuth 2.0 Client Secret)");
  }
  
  if (!googleConfig.redirectUri || 
      placeholderPatterns.some(p => normalizedRedirectUri.includes(p.toLowerCase()))) {
    errors.push("GOOGLE_REDIRECT_URI is missing or invalid (must be a valid HTTPS URL registered in Google Cloud Console)");
  }
  
  // Client ID should be long (Google OAuth 2.0 format: xxx-yyy.apps.googleusercontent.com)
  if (googleConfig.clientId && !googleConfig.clientId.includes("apps.googleusercontent.com")) {
    errors.push("GOOGLE_CLIENT_ID does not match Google OAuth 2.0 format (should end with .apps.googleusercontent.com)");
  }
  
  // Warn about localhost in production
  if (process.env.NODE_ENV === "production" && googleConfig.redirectUri?.includes("localhost")) {
    errors.push("GOOGLE_REDIRECT_URI contains 'localhost' in production environment (must be HTTPS domain)");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

