import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.jsx";

const queryClient = new QueryClient();

// Suppress ChromePolyfill and browser extension errors
// These are non-blocking and caused by browser extensions, not our app
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || "";
  
  // Suppress known non-app errors
  if (
    message.includes("ChromePolyfill") ||
    message.includes("chrome.runtime") ||
    message.includes("message port closed") ||
    message.includes("runtime.lastError")
  ) {
    return; // Silently ignore
  }
  
  // Log all other errors normally
  originalConsoleError.apply(console, args);
};

// Also suppress warnings about these
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args[0]?.toString() || "";
  
  if (
    message.includes("ChromePolyfill") ||
    message.includes("chrome.runtime")
  ) {
    return;
  }
  
  originalConsoleWarn.apply(console, args);
};

const appTree = (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("[FATAL] Root element not found. Cannot mount React app.");
  throw new Error("Root element '#root' not found in DOM");
}

ReactDOM.createRoot(rootElement).render(appTree);
