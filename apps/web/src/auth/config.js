// Frontend must not initiate OAuth directly or hold the confidential client ID.
// Keep this empty to ensure the frontend remains passive and the backend
// is the only party that talks to Google OAuth.
export const GOOGLE_CLIENT_ID = "";
// who can access /console after sign-in
export const ALLOWED_ADMINS = ["lila@thebreakco.com", "mo@thebreakco.com"];
