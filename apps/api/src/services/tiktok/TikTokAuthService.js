import axios from 'axios';
import crypto from 'crypto';

/**
 * TikTok OAuth and Authentication Service
 * Handles TikTok for Developers API authentication flow
 */
export class TikTokAuthService {
  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY;
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    this.redirectUri = process.env.TIKTOK_REDIRECT_URI;
    this.baseUrl = 'https://www.tiktok.com';
    this.apiUrl = 'https://open.tiktokapis.com';
  }

  /**
   * Generate TikTok OAuth authorization URL
   * @param {string} userId - User ID to track in state parameter
   * @returns {string} OAuth authorization URL
   */
  getAuthorizationUrl(userId) {
    if (!this.clientKey || !this.redirectUri) {
      throw new Error('TikTok OAuth not configured. Add TIKTOK_CLIENT_KEY and TIKTOK_REDIRECT_URI to .env');
    }

    // Generate CSRF token for security
    const csrfState = crypto.randomBytes(16).toString('hex');
    const state = Buffer.from(JSON.stringify({ 
      userId, 
      csrfState,
      timestamp: Date.now() 
    })).toString('base64');
    
    // TikTok requires specific scopes
    const scope = 'user.info.basic,video.list';
    
    const params = new URLSearchParams({
      client_key: this.clientKey,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope,
      state
    });

    return `${this.baseUrl}/v2/auth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @returns {Promise<Object>} Token response with access_token, open_id, expires_in
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/auth/token/`, {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri
      }, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message || 'Token exchange failed');
      }

      return response.data.data; // { access_token, expires_in, open_id, refresh_token, scope, token_type }
    } catch (error) {
      console.error('TikTok token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with TikTok');
    }
  }

  /**
   * Refresh access token (TikTok tokens expire in 24 hours)
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Refreshed token response
   */
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/auth/token/`, {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message || 'Token refresh failed');
      }

      return response.data.data; // { access_token, expires_in, open_id, refresh_token, scope, token_type }
    } catch (error) {
      console.error('TikTok token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh TikTok token');
    }
  }

  /**
   * Get user profile data
   * @param {string} accessToken - TikTok access token
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.apiUrl}/v2/user/info/`, {
        params: {
          fields: 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message || 'Profile fetch failed');
      }

      return response.data.data.user;
    } catch (error) {
      console.error('TikTok profile fetch failed:', error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_HIT');
      }
      
      throw new Error('Failed to fetch TikTok profile');
    }
  }

  /**
   * Revoke access token
   * @param {string} accessToken - TikTok access token
   * @returns {Promise<boolean>} True if revoked successfully
   */
  async revokeToken(accessToken) {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/auth/revoke/`, {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        token: accessToken
      }, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        }
      });

      return !response.data.error;
    } catch (error) {
      console.error('TikTok token revoke failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Validate access token is still valid
   * @param {string} accessToken - TikTok access token
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
