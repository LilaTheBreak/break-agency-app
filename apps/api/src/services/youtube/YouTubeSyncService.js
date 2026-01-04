const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const YouTubeAuthService = require('./YouTubeAuthService');

const prisma = new PrismaClient();

class YouTubeSyncService {
  constructor() {
    this.oauth2Client = YouTubeAuthService.oauth2Client;
  }

  /**
   * Sync YouTube channel profile data
   * @param {string} connectionId - Social account connection ID
   * @returns {Promise<Object>} Sync result
   */
  async syncProfile(connectionId) {
    try {
      // Get connection with valid token
      const connection = await prisma.socialAccountConnection.findUnique({
        where: { id: connectionId }
      });

      if (!connection) {
        throw new Error('YouTube connection not found');
      }

      // Ensure token is valid
      const accessToken = await YouTubeAuthService.ensureValidToken(connection);

      // Fetch channel data
      const channelData = await this.fetchChannelData(accessToken);

      // Upsert social profile (using connectionId-based schema)
      const profile = await prisma.socialProfile.upsert({
        where: { connectionId },
        create: {
          connectionId,
          platform: 'youtube',
          handle: channelData.username || connection.handle,
          displayName: channelData.displayName,
          profileImageUrl: channelData.profilePicture,
          followerCount: channelData.subscribers || 0,
          postCount: channelData.videoCount || 0,
          bio: channelData.description,
          externalId: channelData.platformId,
          lastSyncedAt: new Date()
        },
        update: {
          handle: channelData.username || connection.handle,
          displayName: channelData.displayName,
          profileImageUrl: channelData.profilePicture,
          followerCount: channelData.subscribers || 0,
          postCount: channelData.videoCount || 0,
          bio: channelData.description,
          lastSyncedAt: new Date()
        }
      });

      // Save historical metric snapshots
      const now = new Date();
      await prisma.socialMetric.createMany({
        data: [
          {
            profileId: profile.id,
            platform: 'youtube',
            metricType: 'follower_count',
            value: channelData.subscribers || 0,
            snapshotDate: now
          },
          {
            profileId: profile.id,
            platform: 'youtube',
            metricType: 'post_count',
            value: channelData.videoCount || 0,
            snapshotDate: now
          },
          ...(channelData.totalViews ? [{
            profileId: profile.id,
            platform: 'youtube',
            metricType: 'total_views',
            value: channelData.totalViews,
            snapshotDate: now
          }] : [])
        ],
        skipDuplicates: true
      });

      await this.logSync(connectionId, 'profile', true);

      return { success: true, profile };
    } catch (error) {
      console.error('YouTube profile sync error:', error);
      await this.logSync(connectionId, 'profile', false, error.message);
      throw error;
    }
  }

  /**
   * Sync YouTube videos
   * @param {string} connectionId - Social account connection ID
   * @param {number} limit - Max number of videos to sync
   * @returns {Promise<Object>} Sync result
   */
  async syncVideos(connectionId, limit = 50) {
    try {
      // Get connection with valid token
      const connection = await prisma.socialAccountConnection.findUnique({
        where: { id: connectionId },
        include: { SocialProfile: true }
      });

      if (!connection) {
        throw new Error('YouTube connection not found');
      }

      if (!connection.SocialProfile) {
        throw new Error('YouTube profile not found. Sync profile first.');
      }

      const profile = connection.SocialProfile;

      // Ensure token is valid
      const accessToken = await YouTubeAuthService.ensureValidToken(connection);

      // Fetch videos
      const videos = await this.fetchVideos(accessToken, profile.metadata?.uploadsPlaylistId, limit);

      // Upsert each video
      const syncedPosts = [];
      for (const video of videos) {
        const post = await prisma.socialPost.upsert({
          where: {
            profileId_platformPostId: {
              profileId: profile.id,
              platformPostId: video.id
            }
          },
          update: {
            caption: video.caption,
            mediaUrl: video.thumbnail,
            mediaType: 'VIDEO',
            likes: video.likes,
            comments: video.comments,
            views: video.views,
            shares: 0, // YouTube API doesn't provide share count
            engagementRate: video.engagementRate,
            publishedAt: video.publishedAt,
            metadata: video.metadata,
            lastSyncedAt: new Date()
          },
          create: {
            profileId: profile.id,
            platformPostId: video.id,
            caption: video.caption,
            mediaUrl: video.thumbnail,
            mediaType: 'VIDEO',
            likes: video.likes,
            comments: video.comments,
            views: video.views,
            shares: 0,
            engagementRate: video.engagementRate,
            publishedAt: video.publishedAt,
            metadata: video.metadata,
            lastSyncedAt: new Date()
          }
        });
        syncedPosts.push(post);
      }

      // Update profile's average engagement
      if (syncedPosts.length > 0) {
        const avgEngagement =
          syncedPosts.reduce((sum, post) => sum + post.engagementRate, 0) / syncedPosts.length;

        await prisma.socialProfile.update({
          where: { id: profile.id },
          data: { averageEngagement: avgEngagement }
        });

        // Update latest metric with average engagement
        const latestMetric = await prisma.socialMetric.findFirst({
          where: { profileId: profile.id },
          orderBy: { recordedAt: 'desc' }
        });

        if (latestMetric) {
          await prisma.socialMetric.update({
            where: { id: latestMetric.id },
            data: { averageEngagement: avgEngagement }
          });
        }
      }

      await this.logSync(connectionId, 'posts', true, `Synced ${syncedPosts.length} videos`);

      return { success: true, postsCount: syncedPosts.length };
    } catch (error) {
      console.error('YouTube videos sync error:', error);
      await this.logSync(connectionId, 'posts', false, error.message);
      throw error;
    }
  }

  /**
   * Fetch YouTube channel data
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Channel data
   */
  async fetchChannelData(accessToken) {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });

    const response = await youtube.channels.list({
      part: ['snippet', 'statistics', 'contentDetails', 'brandingSettings'],
      mine: true
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('No YouTube channel found');
    }

    const channel = response.data.items[0];
    const stats = channel.statistics;
    const snippet = channel.snippet;

    return {
      platformId: channel.id,
      username: snippet.customUrl || channel.id,
      displayName: snippet.title,
      profilePicture: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      subscribers: parseInt(stats.subscriberCount || 0),
      videoCount: parseInt(stats.videoCount || 0),
      totalViews: parseInt(stats.viewCount || 0),
      description: snippet.description || '',
      metadata: {
        uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
        country: snippet.country,
        customUrl: snippet.customUrl,
        keywords: channel.brandingSettings?.channel?.keywords,
        hiddenSubscriberCount: stats.hiddenSubscriberCount
      }
    };
  }

  /**
   * Fetch YouTube videos from channel
   * @param {string} accessToken - Access token
   * @param {string} uploadsPlaylistId - Uploads playlist ID
   * @param {number} limit - Max number of videos to fetch
   * @returns {Promise<Array>} Videos data
   */
  async fetchVideos(accessToken, uploadsPlaylistId, limit = 50) {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });

    if (!uploadsPlaylistId) {
      throw new Error('Uploads playlist ID not found');
    }

    // Fetch video IDs from uploads playlist
    const playlistResponse = await youtube.playlistItems.list({
      part: ['contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: Math.min(limit, 50)
    });

    if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
      return [];
    }

    const videoIds = playlistResponse.data.items.map(item => item.contentDetails.videoId);

    // Fetch detailed video data
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: videoIds.join(',')
    });

    if (!videosResponse.data.items || videosResponse.data.items.length === 0) {
      return [];
    }

    // Transform video data
    return videosResponse.data.items.map(video => {
      const stats = video.statistics;
      const snippet = video.snippet;
      const likes = parseInt(stats.likeCount || 0);
      const comments = parseInt(stats.commentCount || 0);
      const views = parseInt(stats.viewCount || 0);

      return {
        id: video.id,
        caption: snippet.title || '',
        description: snippet.description || '',
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        likes,
        comments,
        views,
        engagementRate: this.calculateEngagementRate(likes, comments, views),
        publishedAt: new Date(snippet.publishedAt),
        metadata: {
          duration: video.contentDetails?.duration,
          definition: video.contentDetails?.definition,
          categoryId: snippet.categoryId,
          tags: snippet.tags || [],
          defaultLanguage: snippet.defaultLanguage
        }
      };
    });
  }

  /**
   * Calculate engagement rate
   * @param {number} likes - Like count
   * @param {number} comments - Comment count
   * @param {number} views - View count
   * @returns {number} Engagement rate percentage
   */
  calculateEngagementRate(likes, comments, views) {
    if (views === 0) return 0;
    const engagements = likes + comments;
    return (engagements / views) * 100;
  }

  /**
   * Log sync operation
   * @param {number} connectionId - Connection ID
   * @param {string} syncType - Type of sync (profile/posts)
   * @param {boolean} success - Whether sync succeeded
   * @param {string} message - Optional message
   */
  async logSync(connectionId, syncType, success, message = null) {
    try {
      await prisma.socialSyncLog.create({
        data: {
          connectionId,
          syncType,
          status: success ? 'SUCCESS' : 'FAILED',
          itemsProcessed: success ? 1 : 0,
          errorMessage: success ? null : message,
          syncedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log YouTube sync:', error);
    }
  }
}

module.exports = new YouTubeSyncService();
