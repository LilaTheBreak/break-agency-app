/**
 * Social Data Fetchers
 * 
 * Platform-specific modules for fetching profile and post data
 * Supports both OAuth (with tokens) and public scraping
 */

export interface ProfileData {
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  followerCount: number;
  followingCount?: number;
  postCount?: number;
  averageViews?: number;
  averageEngagement?: number;
  engagementRate?: number;
  isVerified?: boolean;
  externalId?: string;
}

export interface PostData {
  externalId: string;
  url: string;
  caption?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL";
  publishedAt: string;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  saves?: number;
}

/**
 * INSTAGRAM FETCHERS
 */
export async function fetchInstagramProfileData(options: {
  handle: string;
  accessToken?: string;
}): Promise<ProfileData> {
  const { handle, accessToken } = options;

  if (accessToken) {
    // OAuth flow with Meta Graph API
    return fetchInstagramProfileDataOAuth(handle, accessToken);
  } else {
    // Public data scraping
    return fetchInstagramProfileDataPublic(handle);
  }
}

async function fetchInstagramProfileDataOAuth(
  handle: string,
  accessToken: string
): Promise<ProfileData> {
  try {
    // Use Meta Graph API v18.0
    // https://developers.facebook.com/docs/instagram-api/reference/user
    
    const response = await fetch(
      `https://graph.instagram.com/v18.0/me?fields=id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,ig_id&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      displayName: data.name || data.username,
      bio: data.biography,
      profileImageUrl: data.profile_picture_url,
      followerCount: data.followers_count || 0,
      followingCount: data.follows_count,
      postCount: data.media_count,
      externalId: data.id,
    };
  } catch (error) {
    console.error("[INSTAGRAM_OAUTH] Profile fetch failed:", error);
    throw error;
  }
}

async function fetchInstagramProfileDataPublic(handle: string): Promise<ProfileData> {
  try {
    // Scrape public Instagram data
    // Note: Instagram actively blocks scraping. This is a placeholder.
    // For production, use Instagram Business API with proper OAuth.
    
    const response = await fetch(`https://www.instagram.com/${handle}/?__a=1`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram profile: ${response.statusText}`);
    }

    const data = await response.json();
    const user = data?.graphql?.user;

    if (!user) {
      throw new Error("Could not parse Instagram profile data");
    }

    return {
      displayName: user.full_name || user.username,
      bio: user.biography,
      profileImageUrl: user.profile_pic_url_hd,
      followerCount: user.edge_followed_by?.count || 0,
      followingCount: user.edge_follow?.count,
      postCount: user.edge_owner_to_timeline_media?.count,
      isVerified: user.is_verified,
      externalId: user.id,
    };
  } catch (error) {
    console.error("[INSTAGRAM_PUBLIC] Profile scrape failed:", error);
    // Return minimal data on failure
    return {
      displayName: handle,
      followerCount: 0,
    };
  }
}

export async function fetchInstagramPosts(options: {
  handle: string;
  accessToken?: string;
}): Promise<PostData[]> {
  const { handle, accessToken } = options;

  if (accessToken) {
    return fetchInstagramPostsOAuth(handle, accessToken);
  } else {
    return fetchInstagramPostsPublic(handle);
  }
}

async function fetchInstagramPostsOAuth(
  handle: string,
  accessToken: string
): Promise<PostData[]> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/me/media?fields=id,caption,timestamp,like_count,comments_count,media_type,permalink,media_product_type&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.data
      .slice(0, 30) // Last 30 posts
      .map((post: any) => ({
        externalId: post.id,
        url: post.permalink,
        caption: post.caption,
        mediaType: post.media_type === "VIDEO" ? "VIDEO" : "IMAGE",
        publishedAt: post.timestamp,
        likes: post.like_count,
        comments: post.comments_count,
      }));
  } catch (error) {
    console.error("[INSTAGRAM_OAUTH] Posts fetch failed:", error);
    return [];
  }
}

async function fetchInstagramPostsPublic(handle: string): Promise<PostData[]> {
  try {
    // Similar scraping approach - blocked by Instagram
    // Placeholder for proper API integration
    const response = await fetch(`https://www.instagram.com/${handle}/?__a=1`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const data = await response.json();
    const edges = data?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];

    return edges
      .slice(0, 30)
      .map((edge: any) => {
        const node = edge.node;
        return {
          externalId: node.id,
          url: `https://www.instagram.com/p/${node.shortcode}/`,
          caption: node.edge_media_to_caption?.edges?.[0]?.node?.text,
          mediaType: node.is_video ? "VIDEO" : "IMAGE",
          publishedAt: new Date(node.taken_at_timestamp * 1000).toISOString(),
          likes: node.edge_liked_by?.count,
          comments: node.edge_media_to_comment?.count,
        };
      });
  } catch (error) {
    console.error("[INSTAGRAM_PUBLIC] Posts scrape failed:", error);
    return [];
  }
}

/**
 * TIKTOK FETCHERS
 */
export async function fetchTikTokProfileData(options: {
  handle: string;
  accessToken?: string;
}): Promise<ProfileData> {
  const { handle, accessToken } = options;

  if (accessToken) {
    return fetchTikTokProfileDataOAuth(handle, accessToken);
  } else {
    return fetchTikTokProfileDataPublic(handle);
  }
}

async function fetchTikTokProfileDataOAuth(
  handle: string,
  accessToken: string
): Promise<ProfileData> {
  try {
    const response = await fetch(
      `https://open.tiktokapis.com/v1/user/info/?access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`TikTok API error: ${response.statusText}`);
    }

    const data = await response.json();
    const user = data.data.user;

    return {
      displayName: user.display_name,
      bio: user.bio_description,
      profileImageUrl: user.avatar_url,
      followerCount: data.data.user.follower_count || 0,
      followingCount: data.data.user.following_count,
      postCount: data.data.user.video_count,
      externalId: user.open_id,
    };
  } catch (error) {
    console.error("[TIKTOK_OAUTH] Profile fetch failed:", error);
    throw error;
  }
}

async function fetchTikTokProfileDataPublic(handle: string): Promise<ProfileData> {
  try {
    // TikTok API requires OAuth - public scraping is blocked
    // Return minimal data structure
    return {
      displayName: handle,
      followerCount: 0,
    };
  } catch (error) {
    console.error("[TIKTOK_PUBLIC] Profile fetch failed:", error);
    return {
      displayName: handle,
      followerCount: 0,
    };
  }
}

export async function fetchTikTokPosts(options: {
  handle: string;
  accessToken?: string;
}): Promise<PostData[]> {
  const { accessToken } = options;

  if (accessToken) {
    return fetchTikTokPostsOAuth(accessToken);
  } else {
    return [];
  }
}

async function fetchTikTokPostsOAuth(accessToken: string): Promise<PostData[]> {
  try {
    const response = await fetch(
      `https://open.tiktokapis.com/v1/video/list/?access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`TikTok API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.data.videos
      .slice(0, 30)
      .map((video: any) => ({
        externalId: video.id,
        url: `https://www.tiktok.com/@*/video/${video.id}`,
        caption: video.description,
        mediaType: "VIDEO",
        publishedAt: new Date(video.create_time * 1000).toISOString(),
        views: video.view_count,
        likes: video.like_count,
        comments: video.comment_count,
        shares: video.share_count,
      }));
  } catch (error) {
    console.error("[TIKTOK_OAUTH] Posts fetch failed:", error);
    return [];
  }
}

/**
 * YOUTUBE FETCHERS
 */
export async function fetchYouTubeProfileData(options: {
  handle: string;
  accessToken?: string;
}): Promise<ProfileData> {
  const { handle, accessToken } = options;

  if (accessToken) {
    return fetchYouTubeProfileDataOAuth(handle, accessToken);
  } else {
    return fetchYouTubeProfileDataPublic(handle);
  }
}

async function fetchYouTubeProfileDataOAuth(
  handle: string,
  accessToken: string
): Promise<ProfileData> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forUsername=${handle}&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    const channel = data.items[0];

    if (!channel) {
      throw new Error("Channel not found");
    }

    return {
      displayName: channel.snippet.title,
      bio: channel.snippet.description,
      profileImageUrl: channel.snippet.thumbnails.high.url,
      followerCount: parseInt(channel.statistics.subscriberCount) || 0,
      postCount: parseInt(channel.statistics.videoCount),
      externalId: channel.id,
    };
  } catch (error) {
    console.error("[YOUTUBE_OAUTH] Profile fetch failed:", error);
    throw error;
  }
}

async function fetchYouTubeProfileDataPublic(handle: string): Promise<ProfileData> {
  try {
    // YouTube public API requires API key
    // Placeholder - requires proper OAuth setup
    return {
      displayName: handle,
      followerCount: 0,
    };
  } catch (error) {
    console.error("[YOUTUBE_PUBLIC] Profile fetch failed:", error);
    return {
      displayName: handle,
      followerCount: 0,
    };
  }
}

export async function fetchYouTubePosts(options: {
  handle: string;
  accessToken?: string;
}): Promise<PostData[]> {
  const { accessToken } = options;

  if (accessToken) {
    return fetchYouTubePostsOAuth(accessToken);
  } else {
    return [];
  }
}

async function fetchYouTubePostsOAuth(accessToken: string): Promise<PostData[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=30&order=date&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.items
      .slice(0, 30)
      .map((item: any) => ({
        externalId: item.id.videoId,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        caption: item.snippet.title,
        mediaType: "VIDEO",
        publishedAt: item.snippet.publishedAt,
        views: 0, // Requires separate statistics call
      }));
  } catch (error) {
    console.error("[YOUTUBE_OAUTH] Posts fetch failed:", error);
    return [];
  }
}
