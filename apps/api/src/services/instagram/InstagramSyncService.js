import axios from 'axios';
import prisma from "../../lib/prisma.js";

/**
 * Instagram Data Sync Service
 * Syncs profile and post data from Instagram Graph API
 */
export class InstagramSyncService {
  /**
   * Sync Instagram profile data
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
        throw new Error('Instagram connection not found or not connected');
      }

      // Fetch profile from Instagram API
      const profile = await this.fetchProfile(connection.accessToken);

      // Upsert profile
      const savedProfile = await prisma.socialProfile.upsert({
        where: { connectionId },
        create: {
          connectionId,
          platform: 'instagram',
          handle: profile.username,
          displayName: profile.name,
          bio: profile.biography,
          profileImageUrl: profile.profile_picture_url,
          followerCount: profile.followers_count || 0,
          followingCount: profile.follows_count || 0,
          postCount: profile.media_count || 0,
          isVerified: profile.is_verified || false,
          externalId: profile.id,
          lastSyncedAt: new Date()
        },
        update: {
          handle: profile.username,
          displayName: profile.name,
          bio: profile.biography,
          profileImageUrl: profile.profile_picture_url,
          followerCount: profile.followers_count || 0,
          followingCount: profile.follows_count || 0,
          postCount: profile.media_count || 0,
          isVerified: profile.is_verified || false,
          lastSyncedAt: new Date()
        }
      });

      // Save historical metric snapshots
      const now = new Date();
      await prisma.socialMetric.createMany({
        data: [
          {
            profileId: savedProfile.id,
            platform: 'instagram',
            metricType: 'follower_count',
            value: profile.followers_count || 0,
            snapshotDate: now
          },
          {
            profileId: savedProfile.id,
            platform: 'instagram',
            metricType: 'following_count',
            value: profile.follows_count || 0,
            snapshotDate: now
          },
          {
            profileId: savedProfile.id,
            platform: 'instagram',
            metricType: 'post_count',
            value: profile.media_count || 0,
            snapshotDate: now
          }
        ],
        skipDuplicates: true
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
      console.error('Instagram profile sync failed:', error);
      await this.logSync(connectionId, 'profile', 'failed', 0, startedAt, error.message);
      throw error;
    }
  }

  /**
   * Sync Instagram posts
   * @param {string} connectionId - SocialAccountConnection ID
   * @param {number} limit - Max posts to fetch (default 25)
   * @returns {Promise<Object>} Sync result with count
   */
  async syncPosts(connectionId, limit = 25) {
    const startedAt = new Date();
    
    try {
      const connection = await prisma.socialAccountConnection.findUnique({
        where: { id: connectionId },
        include: { SocialProfile: true }
      });

      if (!connection || !connection.connected) {
        throw new Error('Instagram connection not found');
      }

      if (!connection.SocialProfile) {
        throw new Error('Profile must be synced before syncing posts');
      }

      // Fetch recent posts from Instagram API
      const posts = await this.fetchPosts(connection.accessToken, limit);

      let synced = 0;
      const errors = [];

      for (const post of posts) {
        try {
          // Fetch insights for each post (if available)
          let insights = {};
          try {
            insights = await this.fetchPostInsights(connection.accessToken, post.id);
          } catch (insightError) {
            console.warn(`Insights not available for post ${post.id}`);
          }

          await prisma.socialPost.upsert({
            where: {
              platform_externalId: {
                platform: 'instagram',
                externalId: post.id
              }
            },
            create: {
              profileId: connection.SocialProfile.id,
              platform: 'instagram',
              externalId: post.id,
              caption: post.caption,
              mediaType: post.media_type?.toLowerCase() || 'unknown',
              mediaUrl: post.media_url,
              thumbnailUrl: post.thumbnail_url,
              permalink: post.permalink,
              likeCount: insights.like_count || 0,
              commentCount: insights.comments_count || 0,
              saveCount: insights.saved || 0,
              viewCount: post.media_type === 'VIDEO' ? insights.video_views : insights.impressions,
              engagementRate: this.calculateEngagementRate(insights),
              postedAt: new Date(post.timestamp),
              lastSyncedAt: new Date()
            },
            update: {
              caption: post.caption,
              likeCount: insights.like_count || 0,
              commentCount: insights.comments_count || 0,
              saveCount: insights.saved || 0,
              viewCount: post.media_type === 'VIDEO' ? insights.video_views : insights.impressions,
              engagementRate: this.calculateEngagementRate(insights),
              lastSyncedAt: new Date()
            }
          });

          synced++;
        } catch (postError) {
          console.error(`Failed to sync post ${post.id}:`, postError);
          errors.push(postError.message);
        }
      }

      // Update connection lastSyncedAt
      await prisma.socialAccountConnection.update({
        where: { id: connectionId },
        data: { lastSyncedAt: new Date() }
      });

      await this.logSync(connectionId, 'posts', 'success', synced, startedAt);

      return { 
        synced, 
        total: posts.length,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      console.error('Instagram posts sync failed:', error);
      await this.logSync(connectionId, 'posts', 'failed', 0, startedAt, error.message);
      throw error;
    }
  }

  /**
   * Fetch profile from Instagram Graph API
   * @param {string} accessToken - Instagram access token
   * @returns {Promise<Object>} Profile data
   */
  async fetchProfile(accessToken) {
    try {
      const response = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,is_verified',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_HIT');
      }
      throw error;
    }
  }

  /**
   * Fetch posts from Instagram Graph API
   * @param {string} accessToken - Instagram access token
   * @param {number} limit - Max posts to fetch
   * @returns {Promise<Array>} Array of posts
   */
  async fetchPosts(accessToken, limit = 25) {
    try {
      const response = await axios.get('https://graph.instagram.com/me/media', {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
          limit,
          access_token: accessToken
        }
      });

      return response.data.data || [];
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_HIT');
      }
      throw error;
    }
  }

  /**
   * Fetch post insights (engagement metrics)
   * Note: Only available for Business/Creator accounts
   * @param {string} accessToken - Instagram access token
   * @param {string} postId - Instagram post ID
   * @returns {Promise<Object>} Post insights
   */
  async fetchPostInsights(accessToken, postId) {
    try {
      const response = await axios.get(`https://graph.instagram.com/${postId}/insights`, {
        params: {
          metric: 'impressions,reach,engagement,saved,video_views',
          access_token: accessToken
        }
      });

      // Convert array of metrics to object
      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values[0]?.value || 0;
      });

      // Also try to get like/comment counts from media object
      const mediaResponse = await axios.get(`https://graph.instagram.com/${postId}`, {
        params: {
          fields: 'like_count,comments_count',
          access_token: accessToken
        }
      });

      return {
        ...insights,
        like_count: mediaResponse.data.like_count,
        comments_count: mediaResponse.data.comments_count
      };
    } catch (error) {
      // Insights may not be available for personal accounts or old posts
      console.warn('Instagram insights not available:', error.message);
      return {};
    }
  }

  /**
   * Calculate engagement rate from insights
   * @param {Object} insights - Post insights
   * @returns {number} Engagement rate percentage
   */
  calculateEngagementRate(insights) {
    if (!insights || Object.keys(insights).length === 0) {
      return 0;
    }

    const engagement = (insights.like_count || 0) + 
                      (insights.comments_count || 0) + 
                      (insights.saved || 0);
    const reach = insights.reach || insights.impressions || 1;
    
    return (engagement / reach) * 100;
  }

  /**
   * Log sync operation to database
   * @param {string} connectionId - SocialAccountConnection ID
   * @param {string} syncType - Type of sync (profile, posts, metrics)
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
          platform: 'instagram',
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
