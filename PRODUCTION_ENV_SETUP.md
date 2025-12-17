# Backend Production Environment Setup Guide

## Required Environment Variables for Production

Set these in your backend hosting platform (Railway, Heroku, etc.):

### Critical for Domain Access

```bash
# Frontend URL (where your frontend is hosted)
FRONTEND_ORIGIN=https://tbctbctbc.online

# Alternative name for same variable
WEB_APP_URL=https://tbctbctbc.online

# Backend API URL (where your backend API is hosted)
API_URL=https://api.tbctbctbc.online

# Cookie domain for authentication
COOKIE_DOMAIN=.tbctbctbc.online

# Enable production mode
NODE_ENV=production

# Enable HTTPS for cookies
USE_HTTPS=true
```

### Database & Auth (Already configured)
```bash
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_jwt_secret
```

### Email Service
```bash
RESEND_API_KEY=your_resend_key
```

### Google OAuth
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://api.tbctbctbc.online/api/auth/google/callback
```

## CORS Configuration

The backend automatically uses `FRONTEND_ORIGIN` for CORS. Make sure it matches your frontend domain exactly.

## Cookie Configuration

With `NODE_ENV=production`:
- Cookies use `SameSite=None`
- Cookies use `Secure=true`
- Cookies use `domain=.tbctbctbc.online` (allows subdomain access)

## Testing

After setting environment variables:
1. Restart your backend server
2. Clear browser cookies
3. Try logging in from https://tbctbctbc.online
4. Check browser DevTools > Network tab for CORS errors
