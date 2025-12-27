import axios from 'axios';

/**
 * Instagram OAuth and Authentication Service
 * Handles Instagram Graph API authentication flow
 */
export class InstagramAuthService {
  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID;
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  }

  /**
   * Generate Instagram OAuth authorization URL
   * @param {string} userId - User ID to track in state parameter
   * @returns {string} OAuth authorization URL
   */
  getAuthorizationUrl(userId) {
    if (!this.clientId || !this.redirectUri) {
      throw new Error('Instagram OAuth not configured. Add INSTAGRAM_CLIENT_ID and INSTAGRAM_REDIRECT_URI to .env');
    }

    const state = Buffer.from(JSON.stringify({ 
      userId, 
      timestamp: Date.now() 
    })).toString('base64');
    
    const scope = 'user_profile,user_media';
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope,
      response_type: 'code',
      state
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for short-lived access token
   * @param {string} code - Authorization code from OAuth callback
   * @returns {Promise<Object>} Token response with access_token and user_id
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://api.instagram.com/oauth/access_token', 
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          code
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      // Returns short-lived token (1 hour)
      return response.data; // { access_token, user_id }
    } catch (error) {
      console.error('Instagram token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Instagram');
    }
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   * @param {string} shortLivedToken - Short-lived access token
   * @returns {Promise<Object>} Long-lived token response
   */
  async getLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get('https://graph.instagram.com/access_token', {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: this.clientSecret,
          access_token: shortLivedToken
        }
      });

      return response.data; // { access_token, token_type, expires_in }
    } catch (error) {
      console.error('Instagram long-lived token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to get long-lived Instagram token');
    }
  }

  /**
   * Refresh long-lived token (extends expiration by 60 days)
   * @param {string} accessToken - Current access token
   * @returns {Promise<Object>} Refreshed token response
   */
  async refreshToken(accessToken) {
    try {
      const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken
        }
      });

      return response.data; // { access_token, token_type, expires_in }
    } catch (error) {
      console.error('Instagram token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh Instagram token');
    }
  }

  /**
   * Get basic user profile data
   * @param {string} accessToken - Instagram access token
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Instagram profile fetch failed:', error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_HIT');
      }
      
      throw new Error('Failed to fetch Instagram profile');
    }
  }

  /**
   * Validate access token is still valid
   * @param {string} accessToken - Instagram access token
   * @returns {Promise<boolean>} True if token is valid
   */
  async validateToken(accessToken) {
    try {
      await this.getUserProfile(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }
}
