import React from "react";

const LOGO_SOURCES = {
  light: "/White Logo.png",
  dark: "/Black Logo.png",
  mark: "/B Logo Mark.png"
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
