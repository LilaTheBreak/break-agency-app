import React from "react";
import { asset } from "../lib/assetHelper.js";

/**
 * LOGO COMPONENT - Asset Strategy
 * 
 * ✅ CORRECT: Logo paths use absolute root-relative paths
 * These load from the frontend origin (www.tbctbctbc.online),
 * never from the API domain (railway.app).
 * 
 * If VITE_API_URL ever changed, logos would still load correctly
 * because they don't depend on env vars.
 */
const LOGO_SOURCES = {
  light: asset("/White Logo.png"),
  dark: asset("/Black Logo.png"),
  // Note: B Logo Mark icon doesn't exist yet; using Black Logo as fallback
  mark: asset("/Black Logo.png")
};

export function LogoWordmark({ variant = "light", className = "", ...props }) {
  const source = LOGO_SOURCES[variant] || LOGO_SOURCES.light;
  const alt =
    variant === "mark" ? "The Break Co. mark" : "The Break Co. logo";
  return (
    <img
      src={source}
      alt={alt}
      className={["h-8 w-auto", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
