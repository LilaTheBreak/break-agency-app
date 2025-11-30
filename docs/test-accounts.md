## Seeded Auth Accounts

After running `pnpm seed:auth` (which calls `apps/api/scripts/seedAuth.ts`), the following users and roles exist. Sign in through Google OAuth using matching emails to inherit the appropriate roles.

| Email | Role(s) | Notes |
| --- | --- | --- |
| `admin@thebreakco.com` | ADMIN | Full Break Console admin access. |
| `manager@thebreakco.com` | TALENT_MANAGER | Talent pod management, briefs, approvals. |
| `brand@thebreakco.com` | BRAND | Brand dashboard + campaign approvals. |
| `exclusive@thebreakco.com` | EXCLUSIVE_TALENT | Premium talent console. |
| `creator@thebreakco.com` | CREATOR | Creator console with briefs + payouts. |
| `ugc@thebreakco.com` | UGC_TALENT | UGC opportunities + billing view. |

Any other Google-authenticated email will be created without roles until assigned manually via Prisma or an admin UI.
