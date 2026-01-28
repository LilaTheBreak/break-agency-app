import React from "react";

/**
 * DEV MODE BANNER
 * 
 * Shows a clear indicator when DEV SAFE MODE is active
 * Only renders in development with VITE_DEV_SAFE_MODE=true
 */

const DEV_SAFE_MODE = import.meta.env.DEV && import.meta.env.VITE_DEV_SAFE_MODE === 'true';

export function DevModeBanner() {
  if (!DEV_SAFE_MODE) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ff6b35',
        color: 'white',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        zIndex: 9999,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      ⚠️ DEV SAFE MODE ACTIVE - Mock Auth Enabled (user: dev@local.test, role: SUPERADMIN)
    </div>
  );
}
