/**
 * YouTube Trends Service
 *
 * Fetches trending video titles, keywords, and categories from YouTube.
 * Uses YouTube Data API v3.
 *
 * Rate limit: Per YouTube quota system
 * Cache: 6 hours
 */

// Uses native fetch from Node.js 18+

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface YouTubeTrendingVideo {
  id: string;
  title: string;
  channelTitle: string;
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  tags?: string[];
  categoryId?: string;
}

/**
 * Fetch trending videos from YouTube
 * Extracts keywords from video titles
 */
export async function fetchYouTubeTrendingVideos(
  regionCode: string = "GB",
  maxResults: number = 20
): Promise<
  Array<{
    topic: string;
    velocity: number;
    volume?: number;
    category?: string;
    relatedKeywords: string[];
  }>
> {
  console.log(
    `[TRENDS] Fetching YouTube trending videos for region: ${regionCode}`
  );

  if (!process.env.YOUTUBE_API_KEY) {
    console.warn(
      `[TRENDS] YouTube API key not configured. Returning empty trends.`
    );
    return [];
  }

  try {
    // Fetch trending videos from YouTube
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=trendingVideo&regionCode=${regionCode}&maxResults=${maxResults}&key=${process.env.YOUTUBE_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        `[TRENDS] YouTube trending fetch failed with status ${response.status}`
      );
      return [];
    }

    const data = await response.json() as {
      items: Array<{
        id: string;
        snippet: {
          title: string;
          channelTitle: string;
          categoryId: string;
          tags?: string[];
        };
        statistics?: {
          viewCount: string;
          likeCount?: string;
          commentCount?: string;
        };
      }>;
    };

    const trends: Array<{
      topic: string;
      velocity: number;
      volume?: number;
      category?: string;
      relatedKeywords: string[];
    }> = [];

    // Extract keywords and trends from video titles
    data.items?.forEach((video, index) => {
      const title = video.snippet.title;

      // Velocity: based on position in trending list
      const velocity = ((maxResults - index) / maxResults) * 100;

      // Extract keywords from title (simple approach: split on common words)
      const keywords = extractKeywords(title);

      trends.push({
        topic: title,
        velocity,
        volume: video.statistics?.viewCount
          ? parseInt(video.statistics.viewCount)
          : undefined,
        category: getCategoryName(video.snippet.categoryId),
        relatedKeywords: keywords,
      });

      console.log(
        `[TRENDS] YouTube: "${title}" velocity=${velocity.toFixed(1)}`
      );
    });

    console.log(
      `[TRENDS] YouTube trending: fetched ${trends.length} trending videos`
    );
    return trends;
  } catch (error) {
    console.error(
      `[TRENDS] YouTube trending fetch failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

/**
 * Fetch trending keywords from YouTube search
 */
export async function fetchYouTubeTrendingKeywords(): Promise<
  Array<{
    topic: string;
    velocity: number;
    volume?: number;
    category?: string;
    relatedKeywords: string[];
  }>
> {
  console.log(`[TRENDS] Fetching YouTube trending keywords`);

  // Get trending videos first
  const trendingVideos = await fetchYouTubeTrendingVideos("GB", 50);

  // Extract most common keywords across all titles
  const keywordFrequency = new Map<string, number>();

  trendingVideos.forEach((video) => {
    video.relatedKeywords.forEach((keyword) => {
      keywordFrequency.set(
        keyword,
        (keywordFrequency.get(keyword) || 0) + 1
      );
    });
  });

  // Convert to sorted array
  const topKeywords = Array.from(keywordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => ({
      topic: keyword,
      velocity: Math.min(100, (count / trendingVideos.length) * 100),
      category: "KEYWORD",
      relatedKeywords: [],
    }));

  console.log(
    `[TRENDS] YouTube keywords: extracted ${topKeywords.length} trending keywords`
  );
  return topKeywords;
}

/**
 * Get all YouTube trends (videos + keywords)
 */
export async function getYouTubeTrends(): Promise<
  Array<{
    topic: string;
    velocity: number;
    volume?: number;
    category?: string;
    relatedKeywords: string[];
  }>
> {
  const [videos, keywords] = await Promise.all([
    fetchYouTubeTrendingVideos("GB", 20),
    fetchYouTubeTrendingKeywords(),
  ]);

  const combined = [...videos, ...keywords].sort(
    (a, b) => b.velocity - a.velocity
  );

  console.log(
    `[TRENDS] YouTube Trends combined: ${combined.length} unique trends`
  );
  return combined;
}

/**
 * Extract meaningful keywords from YouTube video title
 * Filters out common words
 */
function extractKeywords(title: string): string[] {
  const commonWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "is",
    "was",
    "are",
    "be",
    "been",
    "this",
    "that",
    "it",
    "by",
    "from",
    "up",
    "as",
    "official",
    "video",
    "official video",
  ]);

  return title
    .toLowerCase()
    .split(/[^\w]+/)
    .filter(
      (word) =>
        word.length > 3 && !commonWords.has(word) && !/^\d+$/.test(word)
    )
    .slice(0, 5);
}

/**
 * Map YouTube category ID to friendly name
 */
function getCategoryName(categoryId: string): string {
  const categories: Record<string, string> = {
    "1": "FILM_ANIMATION",
    "2": "AUTOS_VEHICLES",
    "10": "MUSIC",
    "15": "PETS_ANIMALS",
    "17": "SPORTS",
    "18": "SHORTS",
    "19": "TRAVEL_EVENTS",
    "20": "GAMING",
    "21": "VIDEOBLOGGING",
    "22": "PEOPLE_BLOGS",
    "23": "COMEDY",
    "24": "ENTERTAINMENT",
    "25": "NEWS_POLITICS",
    "26": "HOWTO_STYLE",
    "27": "EDUCATION",
    "28": "SCIENCE_TECHNOLOGY",
    "29": "NONPROFITS_ACTIVISM",
  };

  return categories[categoryId] || "OTHER";
}
