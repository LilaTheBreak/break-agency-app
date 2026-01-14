# Analytics Tool Setup Guide

## Overview

The analytics tool in Break Agency allows you to analyze social media profiles from Instagram, TikTok, and YouTube. The tool uses a multi-strategy approach to fetch profile data:

1. **Official APIs** - If credentials are configured
2. **Public API Endpoints** - Instagram's public endpoint (fallback)
3. **HTML Scraping** - Extracts data from meta tags (final fallback)

## Configuration

### Instagram

#### Option 1: Official Instagram Graph API (Recommended)
Set these environment variables in `.env`:

```bash
INSTAGRAM_API_TOKEN=your_instagram_business_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id_here
```

Get your token:
1. Go to https://developers.facebook.com/
2. Create an app and enable Instagram Graph API
3. Generate a long-lived user access token
4. Set permissions: `instagram_basic, instagram_manage_messages`

#### Option 2: Public Endpoint (Automatic Fallback)
The system automatically falls back to Instagram's public `web_profile_info` endpoint if the API token isn't set. This has some limitations:
- May be rate limited by Instagram
- Subject to Instagram's anti-bot measures
- Less reliable than official API

#### Option 3: HTML Meta Tag Scraping (Automatic Fallback)
If both options above fail, the system extracts data from Instagram profile page meta tags:
- Fetches the profile page and extracts `og:image`, `og:title`, `og:description`
- Extracts follower count from description
- Subject to Instagram blocking based on User-Agent

### TikTok

TikTok data is fetched through:
1. **Web API** - `https://www.tiktok.com/api/user/detail/`
2. **HTML Fallback** - Extracts data from profile page

No API token required - uses public endpoints with rate limiting (10s cooldown per profile).

### YouTube

YouTube data is fetched through:
1. **Official YouTube Data API** (if `YOUTUBE_API_KEY` is set)
2. **Web Scraping** - Extracts from channel page

Optional: Set `YOUTUBE_API_KEY` in `.env` for better reliability:

```bash
YOUTUBE_API_KEY=your_youtube_api_key
```

## Data Fetching Flow

When a user pastes a profile URL, the system:

1. **Parses** the URL to extract platform and username
2. **Validates** the input format
3. **Checks cache** - Returns cached data if available (12-hour TTL)
4. **Fetches fresh data** using the appropriate platform handler
5. **Stores** the data in the database
6. **Returns** analytics with overview, engagement metrics, and keywords

### Error Handling

If data fetching fails at any stage:
- The system returns empty analytics with an alert message
- The alert indicates the likely cause (private account, blocked, rate limited)
- The frontend displays the error to the user
- User can retry after waiting a few minutes

## Troubleshooting

### "Failed to fetch Instagram profile"

**Cause**: Instagram is blocking the scraper due to:
- Anti-bot protections
- Rate limiting (too many requests)
- User-Agent detection

**Solution**:
1. Wait a few minutes and try again
2. Set `INSTAGRAM_API_TOKEN` to use official API
3. Use a different IP address / proxy (if available)

### "Profile not found"

**Cause**: The profile doesn't exist or has been deleted

**Solution**: Verify the username is correct and the account is public

### "Public account is private"

**Cause**: The account has been set to private after being checked

**Solution**: The user needs to make their account public

## Monitoring

Check logs for debug information:

```bash
# Watch API logs
docker-compose logs -f api

# Filter for analytics issues
docker-compose logs api | grep ANALYTICS
docker-compose logs api | grep INSTAGRAM
docker-compose logs api | grep TIKTOK
```

## Performance

- **Cache TTL**: 12 hours (profiles are cached to reduce API calls)
- **Rate Limits**: 
  - Instagram: 5 seconds between requests per profile
  - TikTok: 10 seconds between requests per profile
  - No limit on YouTube (depends on API quota)
- **Timeout**: 10 seconds per request

## Data Privacy

The analytics tool:
- Only accesses public profile data
- Respects all platforms' robots.txt and terms of service
- Does not store posts, messages, or private data
- Stores only aggregated metrics and profile metadata
