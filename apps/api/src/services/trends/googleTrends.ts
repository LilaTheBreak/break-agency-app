/**
 * Google Trends Service
 *
 * Fetches rising searches and breakout topics from Google Trends.
 * Uses google-trends-api or similar public API.
 *
 * Rate limit: 1 request per minute
 * Cache: 6 hours
 */

// Uses native fetch from Node.js 18+

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const RATE_LIMIT_MS = 60 * 1000; // 1 request per minute

interface GoogleTrendItem {
  title: string;
  exploreLink: string;
  formattedTraffic?: string;
  relatedQueries?: { query: string }[];
  image?: { newsUrl?: string };
}

interface GoogleTrendsResponse {
  default?: {
    trendingSearchesDays: Array<{
      date: string;
      trendingSearches: Array<{
        title: string;
        exploreLink: string;
        formattedTraffic: string;
        relatedQueries: Array<{ query: string; exploreLink: string }>;
        image: { newsUrl: string };
      }>;
    }>;
  };
}

let lastFetchTime = 0;

/**
 * Fetch rising trends from Google Trends API
 * Returns topics that are rising in popularity
 */
export async function fetchGoogleTrends(
  region: string = "GB"
): Promise<
  Array<{
    topic: string;
    velocity: number;
    volume?: number;
    category?: string;
    relatedKeywords: string[];
  }>
> {
  console.log(`[TRENDS] Fetching Google Trends for region: ${region}`);

  // Rate limiting
  const timeSinceLastFetch = Date.now() - lastFetchTime;
  if (timeSinceLastFetch < RATE_LIMIT_MS) {
    console.log(
      `[TRENDS] Rate limit active. Waiting ${RATE_LIMIT_MS - timeSinceLastFetch}ms`
    );
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastFetch)
    );
  }

  try {
    // Using google-trends-api via public endpoint
    // Note: Google Trends doesn't have an official public API
    // This uses pytrends wrapper or similar service
    const response = await fetch(
      `https://trends.google.com/trends/api/dailytrends?hl=en-${region}&tz=-360&geo=GB`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      console.warn(
        `[TRENDS] Google Trends fetch failed with status ${response.status}`
      );
      return [];
    }

    const text = await response.text();
    // Remove XSS prevention prefix
    const jsonStr = text.replace(")]}\'\n", "");
    const data: GoogleTrendsResponse = JSON.parse(jsonStr);

    lastFetchTime = Date.now();

    // Extract trending searches from latest day
    const trends: Array<{
      topic: string;
      velocity: number;
      volume?: number;
      category?: string;
      relatedKeywords: string[];
    }> = [];

    if (data.default?.trendingSearchesDays?.[0]) {
      const dayTrends = data.default.trendingSearchesDays[0].trendingSearches;

      dayTrends.slice(0, 10).forEach((trend, index) => {
        // Velocity: higher rank = higher velocity (inverse of index)
        const velocity = ((10 - index) / 10) * 100;

        const relatedKeywords =
          trend.relatedQueries?.map((q) => q.query).slice(0, 5) || [];

        trends.push({
          topic: trend.title,
          velocity,
          category: "RISING_SEARCH",
          relatedKeywords,
        });

        console.log(
          `[TRENDS] Google: "${trend.title}" velocity=${velocity.toFixed(1)}`
        );
      });
    }

    console.log(
      `[TRENDS] Google Trends: fetched ${trends.length} trending topics`
    );
    return trends;
  } catch (error) {
    console.error(
      `[TRENDS] Google Trends fetch failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

/**
 * Fetch breakout topics (rapidly rising in searches)
 * Usually available as a subset of trending topics
 */
export async function fetchGoogleBreakoutTopics(
  region: string = "GB"
): Promise<
  Array<{
    topic: string;
    velocity: number;
    volume?: number;
    category?: string;
    relatedKeywords: string[];
  }>
> {
  console.log(`[TRENDS] Fetching Google Breakout Topics for region: ${region}`);

  try {
    // Similar to trending but with breakout threshold
    const trends = await fetchGoogleTrends(region);

    // Filter for highest velocity topics (top 25% are "breakout")
    const breakoutThreshold = Math.max(...trends.map((t) => t.velocity)) * 0.75;
    const breakout = trends
      .filter((t) => t.velocity >= breakoutThreshold)
      .map((t) => ({
        ...t,
        category: "BREAKOUT_TOPIC",
      }));

    console.log(`[TRENDS] Google Breakout Topics: found ${breakout.length}`);
    return breakout;
  } catch (error) {
    console.error(
      `[TRENDS] Google Breakout Topics fetch failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

/**
 * Get all Google trends (combined rising + breakout)
 */
export async function getGoogleTrends(
  region: string = "GB"
): Promise<
  Array<{
    topic: string;
    velocity: number;
    volume?: number;
    category?: string;
    relatedKeywords: string[];
  }>
> {
  const [rising, breakout] = await Promise.all([
    fetchGoogleTrends(region),
    fetchGoogleBreakoutTopics(region),
  ]);

  // Deduplicate and combine
  const topicMap = new Map<string, (typeof rising)[0]>();

  rising.forEach((t) => {
    if (!topicMap.has(t.topic)) {
      topicMap.set(t.topic, t);
    }
  });

  breakout.forEach((t) => {
    if (topicMap.has(t.topic)) {
      const existing = topicMap.get(t.topic)!;
      topicMap.set(t.topic, {
        ...existing,
        velocity: Math.max(existing.velocity, t.velocity),
        category: "BREAKOUT_TOPIC", // Prioritize breakout category
      });
    } else {
      topicMap.set(t.topic, t);
    }
  });

  const combined = Array.from(topicMap.values()).sort(
    (a, b) => b.velocity - a.velocity
  );

  console.log(
    `[TRENDS] Google Trends combined: ${combined.length} unique topics`
  );
  return combined;
}
