# React Router + Sentry Hierarchy Fix Summary

## Issue
`useLocation()` crashes when called outside Router context. The hierarchy had `AppErrorBoundary` wrapping `BrowserRouter`, and `App` component was calling `useLocation()` before Router was created.

## Fix Applied

### File Modified
- `apps/web/src/App.jsx`

### Before (Incorrect)
```jsx
function App() {
  const location = useLocation(); // ❌ CRASHES - no Router context
  
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
```

### After (Correct)
```jsx
function App() {
  // ✅ Removed useLocation() - using window.location.pathname instead
  
  return (
    <BrowserRouter>  {/* Outermost - provides Router context */}
      <AppErrorBoundary>  {/* Error boundary wraps full app */}
        <AppRoutes />  {/* useLocation() works here */}
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation(); // ✅ Works - inside Router context
  // Route tracking moved here
}
```

## Hierarchy Confirmation

✅ **Correct Hierarchy:**
```
<BrowserRouter>              ← Outermost (provides Router context)
  <AppErrorBoundary>         ← Error boundary (wraps full app tree)
    <ToastProvider />
    <MessagingContext.Provider>
      <AppRoutes />          ← Uses useLocation() - now has Router context
        <Routes>
          <Route />          ← All routes inside Router
        </Routes>
      </AppRoutes>
    </MessagingContext.Provider>
  </AppErrorBoundary>
</BrowserRouter>
```

## Changes Made

1. **Moved BrowserRouter outside AppErrorBoundary**
   - BrowserRouter is now the outermost provider
   - Provides Router context to all children

2. **Removed useLocation() from App component**
   - App component no longer calls `useLocation()`
   - Uses `window.location.pathname` for Sentry verification (no Router needed)

3. **Moved route tracking to AppRoutes**
   - Route tracking `useEffect` moved from App to AppRoutes
   - Now has Router context via `useLocation()`

4. **Preserved all functionality**
   - Sentry error reporting still works (via AppErrorBoundary)
   - Route tracking still works (moved to AppRoutes)
   - All routing logic unchanged

## Verification

✅ **Components using Router hooks are inside Router:**
- `AppRoutes` uses `useLocation()` and `useNavigate()` - ✅ Inside BrowserRouter
- `RouteErrorBoundary` uses `useLocation()` and `useNavigate()` - ✅ Inside BrowserRouter (via AppRoutes)
- All route components - ✅ Inside BrowserRouter

✅ **No useLocation() calls outside Router:**
- `App` component - ✅ Uses `window.location.pathname` (no Router needed)
- All other components - ✅ Inside Router context

✅ **Error Boundary wraps full app:**
- `AppErrorBoundary` wraps all app content
- Still reports to Sentry via `captureException`
- Provides fallback UI on errors

## Benefits

1. ✅ `useLocation()` now has Router context (no crashes)
2. ✅ `useNavigate()` now has Router context (no crashes)
3. ✅ Error boundary still wraps full app tree
4. ✅ Sentry error reporting still works (via AppErrorBoundary)
5. ✅ Route tracking still works (moved to AppRoutes)
6. ✅ No routing logic changed
7. ✅ All existing props and integrations preserved

## Notes

- `AppErrorBoundary` is a custom error boundary that uses Sentry's `captureException`
- It provides the same error reporting as Sentry's built-in ErrorBoundary
- The hierarchy fix ensures Router context is available to all components
- Route tracking was moved to maintain functionality while fixing the hierarchy
