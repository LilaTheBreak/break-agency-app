## Auth & User Model Notes

- **User entity location**: Defined in `apps/api/prisma/schema.prisma` under the `User` model.
- **Key fields**: `id`, `email`, `password`, `name`, `location`, `timezone`, `pronouns`, `accountType`, `status`, `bio`, `socialLinks`, `createdAt`, `updatedAt`. Relationships exist to social accounts/analytics, payments, invoices, payouts, contracts, etc.
- **Roles**: RBAC now modeled via dedicated `Role` and `UserRole` tables (Prisma `schema.prisma`). Legacy string `role` columns (e.g., `Brief.role`) remain for per-record tagging but should be reconciled with the relational roles.
- **Existing auth-related code (prior to the new OAuth/JWT work)**:
  - Middleware such as `apps/api/src/middleware/requireRole.ts` assumes `req.user.roles` exists but nothing populates it.
  - `apps/api/src/middleware/requestContext.ts` parses `x-break-actor` headers to fake a user context for logging/audit.
  - No `/auth/*` routes or JWT helpers currently implemented. Google Sign-In is frontend-only (`apps/web/src/auth/GoogleSignIn.jsx`) and does not talk to the API.

These notes precede the real OAuth + JWT implementation.
