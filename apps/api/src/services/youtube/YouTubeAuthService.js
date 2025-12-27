const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class YouTubeAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    // YouTube Data API v3 scopes
    this.scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
  }

  /**
   * Generate authorization URL for OAuth flow
   * @param {string} userId - User ID for state parameter
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(userId) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: this.scopes,
      state: userId,
      prompt: 'consent' // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from callback
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expiry_date,
        scope: tokens.scope
      };
    } catch (error) {
      console.error('YouTube token exchange error:', error);
      throw new Error('Failed to exchange YouTube authorization code');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token
   */
  async refreshToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      return {
        accessToken: credentials.access_token,
        expiresIn: credentials.expiry_date
      };
    } catch (error) {
      console.error('YouTube token refresh error:', error);
      throw new Error('Failed to refresh YouTube access token');
    }
  }

  /**
   * Revoke YouTube access token
   * @param {string} accessToken - Access token to revoke
   * @returns {Promise<void>}
   */
  async revokeToken(accessToken) {
    try {
      await this.oauth2Client.revokeToken(accessToken);
    } catch (error) {
      console.error('YouTube token revocation error:', error);
      // Don't throw - token might already be invalid
    }
  }

  /**
   * Get YouTube channel info
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Channel information
   */
  async getChannelInfo(accessToken) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      const response = await youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        mine: true
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('No YouTube channel found for this account');
      }

      const channel = response.data.items[0];
      const stats = channel.statistics;

      return {
        platformId: channel.id,
        platformUsername: channel.snippet.customUrl || channel.snippet.title,
        displayName: channel.snippet.title,
        profilePicture: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
        followers: parseInt(stats.subscriberCount || 0),
        totalVideos: parseInt(stats.videoCount || 0),
        totalViews: parseInt(stats.viewCount || 0),
        description: channel.snippet.description,
        uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads
      };
    } catch (error) {
      console.error('YouTube channel info error:', error);
      throw new Error('Failed to fetch YouTube channel information');
    }
  }

  /**
   * Validate access token
   * @param {string} accessToken - Access token to validate
   * @returns {Promise<boolean>} Whether token is valid
   */
  async validateToken(accessToken) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      await youtube.channels.list({
        part: ['id'],
        mine: true
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ensure user has valid access token, refresh if needed
   * @param {Object} connection - SocialAccountConnection record
   * @returns {Promise<string>} Valid access token
   */
  async ensureValidToken(connection) {
    // Check if token is expired (with 5 minute buffer)
    const expiresAt = new Date(connection.expiresAt);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (expiresAt.getTime() - now.getTime() > bufferMs) {
      // Token still valid
      return connection.accessToken;
    }

    // Token expired or about to expire, refresh it
    console.log(`Refreshing YouTube token for connection ${connection.id}`);
    const { accessToken, expiresIn } = await this.refreshToken(connection.refreshToken);

    // Update database with new token
    await prisma.socialAccountConnection.update({
      where: { id: connection.id },
      data: {
        accessToken,
        expiresAt: new Date(expiresIn),
        lastSyncedAt: new Date()
      }
    });

    return accessToken;
  }
}

module.exports = new YouTubeAuthService();
