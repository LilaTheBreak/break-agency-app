/**
 * Talent Profile Image Service
 * 
 * Automatically fetches and stores social media profile images for talents.
 * Priority: Instagram > TikTok > YouTube > Manual > Initials (fallback)
 * 
 * Features:
 * - Fetches profile images from connected social accounts
 * - Stores URLs in Talent.profileImageUrl
 * - Tracks source in Talent.profileImageSource
 * - Handles errors gracefully with fallback to initials
 * - Respects rate limits and authentication
 * - Caches timestamps to avoid excessive API calls
 */

import axios from 'axios';
import prisma from '../../lib/prisma';

interface SyncOptions {
  limit?: number;
  forceRefresh?: boolean;
  minHoursSinceLastSync?: number;
}

interface Logger {
  info: (msg: string, data?: any) => void;
  warn: (msg: string, data?: any) => void;
  error: (msg: string, data?: any) => void;
}

export class TalentProfileImageService {
  logger: Logger;

  constructor() {
    this.logger = {
      info: (msg, data) => console.log(`[TALENT_IMAGE] ${msg}`, data || ''),
      warn: (msg, data) => console.warn(`[TALENT_IMAGE] ⚠️ ${msg}`, data || ''),
      error: (msg, data) => console.error(`[TALENT_IMAGE] ❌ ${msg}`, data || ''),
    };
  }

  /**
   * Fetch and sync profile image for a talent
   * Checks all connected social accounts in priority order
   */
  async syncTalentProfileImage(talentId) {
    try {
      this.logger.info(`Starting profile image sync for talent: ${talentId}`);

      const talent = await prisma.talent.findUnique({
        where: { id: talentId },
        include: {
          SocialAccountConnection: {
            where: { connected: true },
            include: { SocialProfile: true },
          },
        },
      });

      if (!talent) {
        this.logger.warn(`Talent not found: ${talentId}`);
        return { success: false, error: 'Talent not found' };
      }

      // Priority order: Instagram, TikTok, YouTube
      const platformPriority = ['instagram', 'tiktok', 'youtube'];
      
      for (const platform of platformPriority) {
        const connection = talent.SocialAccountConnection.find(
          (c) => c.platform.toLowerCase() === platform
        );

        if (!connection) continue;

        try {
          const imageUrl = await this.fetchProfileImageForPlatform(
            platform,
            connection
          );

          if (imageUrl) {
            // Update talent with the profile image
            const updated = await prisma.talent.update({
              where: { id: talentId },
              data: {
                profileImageUrl: imageUrl,
                profileImageSource: platform,
                lastProfileImageSyncAt: new Date(),
              },
            });

            this.logger.info(
              `✅ Updated profile image for ${talent.name} from ${platform}`,
              { imageUrl: imageUrl.substring(0, 50) + '...' }
            );

            return {
              success: true,
              source: platform,
              imageUrl,
              talent: updated,
            };
          }
        } catch (error) {
          this.logger.warn(
            `Failed to fetch ${platform} profile image for ${talent.name}`,
            error instanceof Error ? error.message : String(error)
          );
          // Continue to next platform
          continue;
        }
      }

      // If all platforms fail, revert to initials
      const updated = await prisma.talent.update({
        where: { id: talentId },
        data: {
          profileImageUrl: null,
          profileImageSource: 'initials',
          lastProfileImageSyncAt: new Date(),
        },
      });

      this.logger.info(
        `No valid social image found for ${talent.name}, reverted to initials`
      );

      return {
        success: true,
        source: 'initials',
        imageUrl: null,
        talent: updated,
      };
    } catch (error) {
      this.logger.error(
        `Error syncing profile image for talent ${talentId}`,
        error instanceof Error ? error.message : String(error)
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Fetch profile image from specific platform
   */
  async fetchProfileImageForPlatform(platform, connection) {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return this.fetchInstagramProfileImage(connection);
      case 'tiktok':
        return this.fetchTikTokProfileImage(connection);
      case 'youtube':
        return this.fetchYouTubeProfileImage(connection);
      default:
        return null;
    }
  }

  /**
   * Fetch Instagram profile image
   * Uses Instagram Graph API if access token available, falls back to scraping
   */
  async fetchInstagramProfileImage(connection) {
    try {
      // If SocialProfile already has the image, use it
      if (connection.SocialProfile?.profileImageUrl) {
        return connection.SocialProfile.profileImageUrl;
      }

      // If we have an access token, use Instagram Graph API
      if (connection.accessToken) {
        try {
          const response = await axios.get(
            'https://graph.instagram.com/me',
            {
              params: {
                fields: 'id,username,profile_picture_url,name,biography,followers_count,media_count',
                access_token: connection.accessToken,
              },
              timeout: 5000,
            }
          );

          const imageUrl = response.data?.profile_picture_url;

          if (imageUrl && await this.isValidImageUrl(imageUrl)) {
            return imageUrl;
          }
        } catch (apiError) {
          this.logger.warn(
            'Instagram Graph API request failed, falling back to public scraper',
            apiError instanceof Error ? apiError.message : String(apiError)
          );
        }
      }

      // Fallback: Use public scraper for public profiles
      const { scrapeInstagramProfile } = await import(
        '../socialScrapers/instagram.js'
      );
      const handle = connection.handle || connection.profileUrl?.split('/').filter(Boolean).pop();
      
      if (!handle) {
        throw new Error('No Instagram handle available for scraping');
      }

      const profileData = await scrapeInstagramProfile(handle);
      
      if (profileData?.profileImageUrl && await this.isValidImageUrl(profileData.profileImageUrl)) {
        return profileData.profileImageUrl;
      }

      throw new Error('Could not fetch Instagram profile image from API or scraper');
    } catch (error) {
      this.logger.warn(
        'Failed to fetch Instagram profile image',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Fetch TikTok profile image
   * Uses TikTok API if available, falls back to SocialProfile data
   */
  async fetchTikTokProfileImage(connection) {
    try {
      // If SocialProfile already has the image, use it
      if (connection.SocialProfile?.profileImageUrl) {
        return connection.SocialProfile.profileImageUrl;
      }

      // If we have an access token, use TikTok API
      if (connection.accessToken) {
        try {
          const response = await axios.get(
            'https://open.tiktokapis.com/v1/user/info',
            {
              headers: {
                'Authorization': `Bearer ${connection.accessToken}`,
              },
              params: {
                fields: 'open_id,display_name,avatar_url',
              },
              timeout: 5000,
            }
          );

          const imageUrl = response.data?.data?.user?.avatar_url;

          if (imageUrl && await this.isValidImageUrl(imageUrl)) {
            return imageUrl;
          }
        } catch (apiError) {
          this.logger.warn(
            'TikTok API request failed',
            apiError instanceof Error ? apiError.message : String(apiError)
          );
        }
      }

      // No token and no cached image - cannot fetch
      throw new Error('No TikTok access token and no cached profile image');
    } catch (error) {
      this.logger.warn(
        'Failed to fetch TikTok profile image',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Fetch YouTube profile image
   * Uses YouTube Data API
   */
  async fetchYouTubeProfileImage(connection) {
    try {
      if (!connection.accessToken) {
        throw new Error('No YouTube access token');
      }

      // If SocialProfile already has the image, use it
      if (connection.SocialProfile?.profileImageUrl) {
        return connection.SocialProfile.profileImageUrl;
      }

      // Fetch fresh data from YouTube API
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet',
          mine: true,
          access_token: connection.accessToken,
        },
        timeout: 5000,
      });

      const imageUrl = response.data?.items?.[0]?.snippet?.thumbnails?.high?.url;

      if (!imageUrl) {
        throw new Error('No profile picture in YouTube response');
      }

      // Validate URL
      if (!await this.isValidImageUrl(imageUrl)) {
        throw new Error('Invalid YouTube profile image URL');
      }

      return imageUrl;
    } catch (error) {
      this.logger.warn(
        'Failed to fetch YouTube profile image',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Validate image URL
   * Ensures URL is valid, accessible, and not a placeholder
   * Includes HEAD request to verify URL returns image content type
   */
  async isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;

    // Check basic URL format
    try {
      new URL(url);
    } catch {
      return false;
    }

    // Reject placeholder URLs
    const placeholders = [
      'placeholder',
      'via.placeholder',
      'ui-avatars',
      'default',
      'anonymous',
    ];
    const lowerUrl = url.toLowerCase();
    if (placeholders.some((p) => lowerUrl.includes(p))) {
      return false;
    }

    // Accept common CDN URLs and direct image URLs
    const validDomains = [
      'cdn',
      'instagram',
      'tiktok',
      'youtube',
      'googleusercontent',
      'storage.googleapis',
      'ggpht',
      'yt',
      'scontent',
      'fbcdn',
      'cdninstagram',
      'i.instagram',
    ];
    
    if (!validDomains.some((d) => lowerUrl.includes(d))) {
      // Log what URL was rejected for debugging
      this.logger.warn(`URL rejected - domain not whitelisted: ${lowerUrl.substring(0, 50)}`);
      return false;
    }

    // For Instagram/TikTok CDN URLs, verify they're still accessible and return images
    // This catches expired URLs that Instagram CDN returns as HTML error pages
    try {
      const response = await axios.head(url, {
        timeout: 3000,
        maxRedirects: 2,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      // Check if response is actually an image
      const contentType = response.headers['content-type'] || '';
      const isImageType = contentType.startsWith('image/');
      
      // Also check content-length to detect placeholder responses
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      const isReasonableSize = contentLength > 500; // Relaxed to 500 bytes for smaller images

      if (!isImageType) {
        this.logger.warn(`Content is not an image (${contentType}): ${url.substring(0, 50)}`);
      }
      
      if (!isReasonableSize) {
        this.logger.warn(`Image too small (${contentLength} bytes): ${url.substring(0, 50)}`);
      }

      return isImageType && isReasonableSize;
    } catch (error) {
      // If HEAD request fails, the URL is not accessible
      // This includes expired Instagram CDN URLs that return 404 or redirect to login
      this.logger.warn(
        `Image URL validation failed for ${url}`,
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  /**
   * Sync profile images for all talents with connected social accounts
   * Called by cron job or scheduled background task
   */
  async syncAllTalents(options: SyncOptions = {}) {
    const { 
      limit = 100,
      forceRefresh = false,
      minHoursSinceLastSync = 24,
    } = options;

    try {
      this.logger.info('Starting batch profile image sync');

      // Find talents that need syncing
      let where: any = {
        SocialAccountConnection: {
          some: { connected: true },
        },
      };

      // Add date filter if not forcing refresh
      if (!forceRefresh) {
        const minDateTime = new Date(
          Date.now() - minHoursSinceLastSync * 60 * 60 * 1000
        );
        where = {
          AND: [
            {
              SocialAccountConnection: {
                some: { connected: true },
              },
            },
            {
              OR: [
                { lastProfileImageSyncAt: null },
                { lastProfileImageSyncAt: { lt: minDateTime } },
              ],
            },
          ],
        };
      }

      const talents = await prisma.talent.findMany({
        where,
        include: { SocialAccountConnection: { where: { connected: true } } },
        take: limit,
      });

      this.logger.info(`Found ${talents.length} talents to sync`);

      const results = {
        total: talents.length,
        successful: 0,
        failed: 0,
        errors: [] as Array<{ talentId: string; error?: string }>,
      };

      for (const talent of talents) {
        const result = await this.syncTalentProfileImage(talent.id);
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            talentId: talent.id,
            error: result.error,
          });
        }
      }

      this.logger.info('Batch sync completed', results);
      return results;
    } catch (error) {
      this.logger.error(
        'Error during batch sync',
        error instanceof Error ? error.message : String(error)
      );
      return {
        total: 0,
        successful: 0,
        failed: 0,
        errors: [{ error: error instanceof Error ? error.message : String(error) }],
      };
    }
  }

  /**
   * Clear profile image (when all social accounts are disconnected)
   */
  async clearTalentProfileImage(talentId) {
    try {
      const updated = await prisma.talent.update({
        where: { id: talentId },
        data: {
          profileImageUrl: null,
          profileImageSource: 'initials',
          lastProfileImageSyncAt: new Date(),
        },
      });

      this.logger.info(`Cleared profile image for talent: ${talentId}`);
      return { success: true, talent: updated };
    } catch (error) {
      this.logger.error(
        `Error clearing profile image for talent ${talentId}`,
        error instanceof Error ? error.message : String(error)
      );
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Export singleton instance
export const talentProfileImageService = new TalentProfileImageService();
