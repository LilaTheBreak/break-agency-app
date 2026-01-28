# 🚀 DEV SAFE MODE

Local development mode that bypasses authentication for easier UI development.

## What is DEV SAFE MODE?

A **dev-only** feature that:
- ✅ Bypasses authentication requirements
- ✅ Provides a mock SUPERADMIN user
- ✅ Prevents white screen crashes
- ✅ Allows UI/component development without backend
- ⚠️ **NEVER runs in production** (protected by `import.meta.env.DEV` check)

## Quick Start

### 1. Enable DEV SAFE MODE

Create `apps/web/.env.local`:

```bash
cd apps/web
cp .env.local.example .env.local
```

The file should contain:

```env
VITE_DEV_SAFE_MODE=true
```

### 2. Start Dev Server

```bash
npm run dev
```

### 3. Open in Browser

- **VS Code Simple Browser**: Press `Cmd+Shift+P` → "Simple Browser: Show"
- **Regular Browser**: Open http://localhost:5173

You should see:
- ✅ App renders without white screen
- ✅ Orange banner at bottom: "DEV SAFE MODE ACTIVE"
- ✅ Mock user: `dev@local.test` (SUPERADMIN role)
- ✅ All admin features visible

## Mock User Details

When DEV SAFE MODE is active, you're logged in as:

```javascript
{
  id: 'dev-local-user',
  email: 'dev@local.test',
  name: 'Local Dev Admin',
  role: 'SUPERADMIN', // Full permissions
  onboardingComplete: true
}
```

## What's Protected?

### ✅ Safe for Production

All DEV SAFE MODE code is wrapped in:

```javascript
if (import.meta.env.DEV && import.meta.env.VITE_DEV_SAFE_MODE === 'true') {
  // Dev-only code here
}
```

This means:
- **Production builds** (`npm run build`) will **strip out** all dev mode code
- **Railway deployments** will **never** activate dev mode (no .env.local file)
- **Safety**: Production always requires real auth

### 🔒 Security Guarantees

1. **`import.meta.env.DEV`** = `false` in production builds
2. **`VITE_DEV_SAFE_MODE`** environment variable not set in production
3. **Double guard**: Both conditions must be true
4. **Vite tree-shaking**: Dev code completely removed from production bundle

## Files Modified

### Core Changes

| File | Change |
|------|--------|
| `apps/web/src/context/AuthContext.jsx` | Added DEV SAFE MODE bypass with mock user |
| `apps/web/src/lib/permissions.js` | Added null-safe guards (already present) |
| `apps/web/src/components/DevModeBanner.jsx` | Visual indicator banner |
| `apps/web/src/App.jsx` | Import and render DevModeBanner |

### Configuration Files

| File | Purpose |
|------|---------|
| `apps/web/.env.example` | Updated with DEV SAFE MODE docs |
| `apps/web/.env.local.example` | Template for local dev setup |
| `.vscode/tasks.json` | VS Code tasks for dev server |

## Usage Examples

### Component Development

```jsx
// Edit components without auth barrier
export function MyAdminComponent() {
  const canWrite = usePermission("finance:write");
  // ✅ Works immediately - mock user has all permissions
  
  return canWrite ? <EditButton /> : null;
}
```

### Permission Testing

Test different roles by changing the mock user in `AuthContext.jsx`:

```javascript
// Test as CREATOR
role: 'CREATOR'

// Test as BRAND
role: 'BRAND'

// Test as ADMIN
role: 'ADMIN'
```

### Layout Work

Work on layouts without API calls:

```jsx
export function AdminDashboard() {
  const { user } = useAuth();
  // ✅ user is always defined in dev mode
  
  return <div>Welcome {user.name}</div>;
}
```

## Disabling DEV SAFE MODE

### Option 1: Remove from .env.local

```bash
# Remove or comment out
# VITE_DEV_SAFE_MODE=true
```

### Option 2: Set to false

```env
VITE_DEV_SAFE_MODE=false
```

### Option 3: Delete .env.local

```bash
rm apps/web/.env.local
```

Then restart the dev server.

## Troubleshooting

### "White screen still appears"

1. Check `.env.local` exists in `apps/web/`
2. Verify `VITE_DEV_SAFE_MODE=true` is set
3. Restart dev server (`Ctrl+C` then `npm run dev`)
4. Hard refresh browser (`Cmd+Shift+R`)

### "Banner doesn't show"

1. Check browser console for "[AUTH] DEV SAFE MODE active"
2. Verify you're running `npm run dev` (not production build)
3. Check `import.meta.env.DEV` is `true` in console

### "API calls still fail"

That's expected! DEV SAFE MODE only bypasses **auth**, not API calls.

For full functionality:
- Run backend: `cd apps/api && npm run dev`
- Or mock API responses in components

### "Production deployment broken"

This should be impossible due to guards, but if it happens:

1. Check Railway logs for "[AUTH] DEV SAFE MODE active" (shouldn't appear)
2. Verify `.env.local` is gitignored (it is)
3. Confirm `VITE_DEV_SAFE_MODE` not set in Railway environment

## VS Code Integration

### Simple Browser

Open app in VS Code:

1. Start dev server: `npm run dev`
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Simple Browser: Show"
4. Enter URL: `http://localhost:5173`

### Task Runner

Run dev server from VS Code:

1. Press `Cmd+Shift+P` → "Tasks: Run Task"
2. Select "Start Dev Server"
3. Server runs in integrated terminal

## Best Practices

### ✅ DO

- Use DEV SAFE MODE for UI/component work
- Test different user roles by editing mock user
- Develop layouts and permissions without backend
- Use for rapid iteration on frontend

### ❌ DON'T

- Commit `.env.local` to git (it's gitignored)
- Enable DEV SAFE MODE in production
- Rely on dev mode for auth testing (use real auth)
- Hardcode user data outside dev guards

## Related Documentation

- [PERMISSIONS_AUDIT_REPORT.md](../../PERMISSIONS_AUDIT_REPORT.md) - Permission system docs
- [ACCOUNT_SETUP_FLOW.md](../../ACCOUNT_SETUP_FLOW.md) - Real auth flow
- [SYSTEMS_HEALTH_AUDIT.md](../../SYSTEMS_HEALTH_AUDIT.md) - System architecture

## Questions?

If you encounter issues:

1. Check this README
2. Search codebase for "DEV_SAFE_MODE"
3. Review `AuthContext.jsx` implementation
4. Ask in team chat

---

**Remember**: Local development should never depend on production infrastructure. Make the app safe to render first, then progressively enhance with real data.
