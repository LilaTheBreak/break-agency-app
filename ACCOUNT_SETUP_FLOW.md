# Account Setup Email Flow - Implementation Summary

## Overview
When an admin adds a new user via the admin panel, the system now automatically sends an email invitation that allows the user to set their password and complete their account setup before being redirected to onboarding.

## Flow

### 1. Admin Creates User
- Admin fills out the "Add user" form in the admin dashboard
- Admin specifies: email, role, optional name, optional initial password
- Clicks "Save"

### 2. Backend Creates User & Sends Email
**File**: `/apps/api/src/routes/users.ts`

- Generates secure 32-byte random token for account setup
- Token expires in 7 days
- Stores token temporarily in `admin_notes` field (as JSON) until proper token field is added
- Sets user status to `"invited"`
- Sends branded email using the `account-setup` template
- Email includes setup link: `http://localhost:5173/setup?token={token}&email={email}`

### 3. User Receives Email
**Template**: `/apps/api/src/emails/templates/accountSetup.ts`

Email contains:
- Personalized greeting with user's name
- Role badge showing their assigned role
- Call-to-action button linking to setup page
- Inviter's name
- 7-day expiration notice

### 4. User Clicks Setup Link
**Frontend**: `/apps/web/src/pages/AccountSetupPage.jsx`

- Route: `/setup?token={token}&email={email}`
- Page verifies token with backend via `POST /api/setup/verify`
- If valid, shows setup form
- If invalid/expired, shows error message

### 5. User Completes Setup
**Backend**: `/apps/api/src/routes/setup.ts`

User submits:
- Name (optional, pre-filled if provided by admin)
- Password (min 6 characters)
- Confirm password

Backend:
- Verifies token is still valid
- Hashes password with bcrypt (10 rounds)
- Updates user record:
  - Sets password
  - Updates name if changed
  - Sets `onboarding_status` to `"active"`
  - Sets `onboardingComplete` to `false` (will be true after onboarding)
  - Clears token from `admin_notes`
- Creates session JWT
- Sets session cookie
- Returns success

### 6. Redirect to Onboarding
- Frontend receives successful response
- Shows success message briefly
- Redirects to `/onboarding` after 1.5 seconds
- User is now authenticated and ready for onboarding

## Files Created

1. **`/apps/api/src/emails/templates/accountSetup.ts`**
   - Beautiful branded email template
   - Responsive HTML with inline styles
   - Plain text fallback

2. **`/apps/api/src/routes/setup.ts`**
   - `POST /api/setup/verify` - Verifies token validity
   - `POST /api/setup/complete` - Completes account setup

3. **`/apps/web/src/pages/AccountSetupPage.jsx`**
   - Setup form UI matching Break design system
   - Token verification flow
   - Password creation with confirmation
   - Error handling and success states

## Files Modified

1. **`/apps/api/src/routes/users.ts`**
   - Added crypto import for token generation
   - Added sendEmail import
   - Updated POST / endpoint to generate token and send email
   - Token stored in `admin_notes` as JSON: `{setupToken, tokenExpiry, invitedBy}`

2. **`/apps/api/src/emails/templates/index.ts`**
   - Registered `account-setup` template

3. **`/apps/api/src/emails/templates/types.ts`**
   - Added `"account-setup"` to `EmailTemplateName` type

4. **`/apps/api/src/server.ts`**
   - Imported `setupRouter`
   - Registered at `/api/setup`

5. **`/apps/web/src/App.jsx`**
   - Imported `AccountSetupPage`
   - Added route: `<Route path="/setup" element={<AccountSetupPage />} />`

6. **`/apps/api/.env`**
   - Added `WEB_URL=http://localhost:5173` for email link generation

## Security Features

- **Secure tokens**: 32-byte cryptographically random tokens
- **Token expiration**: 7-day validity window
- **Password hashing**: bcrypt with 10 rounds
- **Token cleanup**: Token removed after use
- **Validation**: Email format, password length, token verification
- **Session creation**: Automatic login after setup via JWT cookie

## Environment Variables

Required in `/apps/api/.env`:
- `WEB_URL` - Frontend URL for email links (e.g., `http://localhost:5173`)
- `RESEND_API_KEY` - API key for email sending
- `EMAIL_FROM` - Sender email address (defaults to `console@thebreak.co`)
- `JWT_SECRET` - Secret for signing session tokens

## User States

1. **invited** - User created, email sent, awaiting setup
2. **active** - Setup complete, ready for onboarding
3. **approved** - Onboarding complete (set by admin approval)

## Future Enhancements

1. Add `setupToken` and `setupTokenExpiry` fields to User schema (instead of storing in `admin_notes`)
2. Add resend invitation option in admin UI
3. Add email template preview in admin settings
4. Track invitation sent timestamp
5. Add ability to revoke/regenerate tokens
6. Send reminder emails before token expiry
7. Allow admins to customize invitation message

## Testing

To test the flow:

1. Log in as admin (lila@thebreakco.com or mo@thebreakco.com)
2. Go to Admin → Users
3. Click "Add user"
4. Fill in email, select role, optionally add name
5. Click "Save"
6. Check console logs for email sending confirmation
7. Copy the setup URL from logs or check email inbox
8. Visit setup page
9. Complete setup form
10. Verify redirect to onboarding

## Notes

- Setup tokens are currently stored in `admin_notes` as JSON until a proper schema field is added
- Email sending uses existing Resend integration via `emailService.ts`
- If email fails to send, user creation still succeeds (logged as warning)
- Admins can manually set passwords in the form if email sending is not desired
