# React Router + Sentry Hierarchy Fix

## Issue
`useLocation()` crashes when called outside Router context. The hierarchy had `AppErrorBoundary` wrapping `BrowserRouter`, which could cause issues.

## Fix Applied

### File Modified
- `apps/web/src/App.jsx`

### Before
```jsx
<AppErrorBoundary>
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
</AppErrorBoundary>
```

### After
```jsx
<BrowserRouter>
  <AppErrorBoundary>
    <AppRoutes />
  </AppErrorBoundary>
</BrowserRouter>
```

## Hierarchy Confirmation

✅ **Correct Hierarchy:**
```
<BrowserRouter>              ← Outermost (provides Router context)
  <AppErrorBoundary>         ← Error boundary (wraps full app tree)
    <ToastProvider />
    <MessagingContext.Provider>
      <AppRoutes />          ← Uses useLocation() - now has Router context
    </MessagingContext.Provider>
  </AppErrorBoundary>
</BrowserRouter>
```

## Verification

✅ **Components using Router hooks are inside Router:**
- `AppRoutes` uses `useLocation()` and `useNavigate()` - ✅ Inside BrowserRouter
- `RouteErrorBoundary` uses `useLocation()` and `useNavigate()` - ✅ Inside BrowserRouter (via AppRoutes)
- All route components - ✅ Inside BrowserRouter

✅ **Error Boundary wraps full app:**
- `AppErrorBoundary` wraps all app content
- Still reports to Sentry via `captureException`
- Provides fallback UI on errors

## Benefits

1. ✅ `useLocation()` now has Router context (no crashes)
2. ✅ `useNavigate()` now has Router context (no crashes)
3. ✅ Error boundary still wraps full app tree
4. ✅ Sentry error reporting still works (via AppErrorBoundary)
5. ✅ No routing logic changed
6. ✅ All existing props and integrations preserved

## Notes

- `AppErrorBoundary` is a custom error boundary that uses Sentry's `captureException`
- It provides the same error reporting as Sentry's built-in ErrorBoundary
- The hierarchy fix ensures Router context is available to all components
