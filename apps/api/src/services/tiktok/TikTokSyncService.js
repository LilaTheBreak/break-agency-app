import axios from 'axios';
import prisma from "../../lib/prisma.js";

/**
 * TikTok Data Sync Service
 * Syncs profile and video data from TikTok API
 */
export class TikTokSyncService {
  constructor() {
    this.apiUrl = 'https://open.tiktokapis.com';
  }

  /**
   * Sync TikTok profile data
   * @param {string} connectionId - SocialAccountConnection ID
   * @returns {Promise<Object>} Synced profile data
   */
  async syncProfile(connectionId) {
    const startedAt = new Date();
    
    try {
      // Get connection
      const connection = await prisma.socialAccountConnection.findUnique({
        where: { id: connectionId }
      });

      if (!connection || !connection.connected) {
        throw new Error('TikTok connection not found or not connected');
      }

      // Fetch profile from TikTok API
      const profile = await this.fetchProfile(connection.accessToken);

      // Extract username from profile deep link or use display name
      const handle = this.extractUsername(profile.profile_deep_link) || profile.display_name;

      // Upsert profile
      const savedProfile = await prisma.socialProfile.upsert({
        where: { connectionId },
        create: {
          connectionId,
          platform: 'tiktok',
          handle,
          displayName: profile.display_name,
          bio: profile.bio_description,
          profileImageUrl: profile.avatar_url,
          followerCount: profile.follower_count || 0,
          followingCount: profile.following_count || 0,
          postCount: profile.video_count || 0,
          isVerified: profile.is_verified || false,
          externalId: profile.open_id,
          lastSyncedAt: new Date(),
          metadata: {
            unionId: profile.union_id,
            likesCount: profile.likes_count
          }
        },
        update: {
          handle,
          displayName: profile.display_name,
          bio: profile.bio_description,
          profileImageUrl: profile.avatar_url,
          followerCount: profile.follower_count || 0,
          followingCount: profile.following_count || 0,
          postCount: profile.video_count || 0,
          isVerified: profile.is_verified || false,
          lastSyncedAt: new Date(),
          metadata: {
            unionId: profile.union_id,
            likesCount: profile.likes_count
          }
        }
      });

      // Save historical metric snapshot
      await prisma.socialMetric.create({
        data: {
          profileId: savedProfile.id,
          platform: 'tiktok',
          metricType: 'follower_count',
          value: profile.follower_count || 0,
          snapshotDate: new Date()
        }
      });

      // Update connection lastSyncedAt
      await prisma.socialAccountConnection.update({
        where: { id: connectionId },
        data: { lastSyncedAt: new Date() }
      });

      // Log success
      await this.logSync(connectionId, 'profile', 'success', 1, startedAt);

      return savedProfile;
    } catch (error) {
      console.error('TikTok profile sync failed:', error);
      await this.logSync(connectionId, 'profile', 'failed', 0, startedAt, error.message);
      throw error;
    }
  }

  /**
   * Sync TikTok videos
   * @param {string} connectionId - SocialAccountConnection ID
   * @param {number} limit - Max videos to fetch (default 20, max 20 per request)
   * @returns {Promise<Object>} Sync result with count
   */
  async syncVideos(connectionId, limit = 20) {
    const startedAt = new Date();
    
    try {
      const connection = await prisma.socialAccountConnection.findUnique({
        where: { id: connectionId },
        include: { SocialProfile: true }
      });

      if (!connection || !connection.connected) {
        throw new Error('TikTok connection not found');
      }

      if (!connection.SocialProfile) {
        throw new Error('Profile must be synced before syncing videos');
      }

      // Fetch recent videos from TikTok API
      const videos = await this.fetchVideos(connection.accessToken, Math.min(limit, 20));

      let synced = 0;
      const errors = [];

      for (const video of videos) {
        try {
          await prisma.socialPost.upsert({
            where: {
              platform_externalId: {
                platform: 'tiktok',
                externalId: video.id
              }
            },
            create: {
              profileId: connection.SocialProfile.id,
              platform: 'tiktok',
              externalId: video.id,
              caption: video.title || video.video_description,
              mediaType: 'video',
              mediaUrl: video.embed_link,
              thumbnailUrl: video.cover_image_url,
              permalink: video.share_url,
              viewCount: video.view_count || 0,
              likeCount: video.like_count || 0,
              commentCount: video.comment_count || 0,
              shareCount: video.share_count || 0,
              engagementRate: this.calculateEngagementRate({
                likes: video.like_count,
                comments: video.comment_count,
                shares: video.share_count,
                views: video.view_count
              }),
              postedAt: new Date(video.create_time * 1000), // Unix timestamp to Date
              lastSyncedAt: new Date()
            },
            update: {
              caption: video.title || video.video_description,
              viewCount: video.view_count || 0,
              likeCount: video.like_count || 0,
              commentCount: video.comment_count || 0,
              shareCount: video.share_count || 0,
              engagementRate: this.calculateEngagementRate({
                likes: video.like_count,
                comments: video.comment_count,
                shares: video.share_count,
                views: video.view_count
              }),
              lastSyncedAt: new Date()
            }
          });

          synced++;
        } catch (videoError) {
          console.error(`Failed to sync video ${video.id}:`, videoError);
          errors.push(videoError.message);
        }
      }

      // Update connection lastSyncedAt
      await prisma.socialAccountConnection.update({
        where: { id: connectionId },
        data: { lastSyncedAt: new Date() }
      });

      await this.logSync(connectionId, 'videos', 'success', synced, startedAt);

      return { 
        synced, 
        total: videos.length,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      console.error('TikTok videos sync failed:', error);
      await this.logSync(connectionId, 'videos', 'failed', 0, startedAt, error.message);
      throw error;
    }
  }

  /**
   * Fetch profile from TikTok API
   * @param {string} accessToken - TikTok access token
   * @returns {Promise<Object>} Profile data
   */
  async fetchProfile(accessToken) {
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
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_HIT');
      }
      throw error;
    }
  }

  /**
   * Fetch videos from TikTok API
   * @param {string} accessToken - TikTok access token
   * @param {number} limit - Max videos to fetch (max 20 per request)
   * @returns {Promise<Array>} Array of videos
   */
  async fetchVideos(accessToken, limit = 20) {
    try {
      const response = await axios.post(`${this.apiUrl}/v2/video/list/`, {
        max_count: Math.min(limit, 20) // TikTok API limit is 20 per request
      }, {
        params: {
          fields: 'id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message || 'Video list fetch failed');
      }

      return response.data.data.videos || [];
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_HIT');
      }
      throw error;
    }
  }

  /**
   * Calculate engagement rate from metrics
   * @param {Object} metrics - Video metrics (likes, comments, shares, views)
   * @returns {number} Engagement rate percentage
   */
  calculateEngagementRate(metrics) {
    if (!metrics || !metrics.views || metrics.views === 0) {
      return 0;
    }

    const engagement = (metrics.likes || 0) + 
                      (metrics.comments || 0) + 
                      (metrics.shares || 0);
    
    return (engagement / metrics.views) * 100;
  }

  /**
   * Extract username from TikTok profile deep link
   * @param {string} profileLink - Profile deep link URL
   * @returns {string|null} Username or null
   */
  extractUsername(profileLink) {
    if (!profileLink) return null;
    
    // TikTok profile links: https://www.tiktok.com/@username
    const match = profileLink.match(/@([^?/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Log sync operation to database
   * @param {string} connectionId - SocialAccountConnection ID
   * @param {string} syncType - Type of sync (profile, videos, metrics)
   * @param {string} status - Status (success, failed, partial)
   * @param {number} itemsSynced - Number of items synced
   * @param {Date} startedAt - When sync started
   * @param {string} errorMessage - Error message if failed
   */
  async logSync(connectionId, syncType, status, itemsSynced, startedAt, errorMessage = null) {
    const completedAt = new Date();
    const duration = completedAt - startedAt;

    try {
      await prisma.socialSyncLog.create({
        data: {
          connectionId,
          platform: 'tiktok',
          syncType,
          status,
          itemsSynced,
          errorMessage,
          errorCode: errorMessage === 'RATE_LIMIT_HIT' ? 'RATE_LIMIT' : null,
          rateLimitHit: errorMessage === 'RATE_LIMIT_HIT',
          startedAt,
          completedAt,
          duration
        }
      });
    } catch (logError) {
      console.error('Failed to log sync:', logError);
      // Don't throw - logging failure shouldn't break sync
    }
  }
}
