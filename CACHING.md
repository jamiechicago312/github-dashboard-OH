# Caching Strategy

## Overview

The GitHub Dashboard implements a comprehensive caching strategy to minimize GitHub API calls and avoid rate limiting issues.

## Rate Limiting Context

**GitHub API Limits:**
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour

**Without Caching:**
- ~40 API calls per dashboard load
- Auto-refresh every 5 minutes = 12 loads/hour
- **480 API calls/hour per user**
- With just 10 users: **4,800 calls/hour** (approaching limit!)

## Caching Implementation

### Server-Side Caching

**In-Memory Cache (`lib/cache.ts`)**
- Simple memory-based cache for development
- Automatic TTL (Time To Live) management
- Automatic cleanup of expired entries
- Cache statistics and monitoring

**Cache TTL Configuration:**
```typescript
repository: 30 minutes      // Repository info changes infrequently
organization: 60 minutes    // Organization info changes very infrequently  
contributors: 15 minutes    // Contributors can change more frequently
orgMembers: 60 minutes      // Organization members change infrequently
recentActivity: 5 minutes   // Recent commits, PRs, issues change frequently
releases: 30 minutes        // Releases don't change often
stats: 10 minutes          // Statistics are expensive to calculate
dashboardData: 5 minutes   // Overall dashboard data
contributorDetails: 120 minutes // User details change very infrequently
```

### Client-Side Caching

**SWR Configuration:**
```typescript
refreshInterval: 900000,     // Refresh every 15 minutes (was 5 minutes)
revalidateOnFocus: false,    // Don't refetch when window gains focus
revalidateOnReconnect: false, // Don't refetch on network reconnect
dedupingInterval: 300000,    // Dedupe requests within 5 minutes
```

## Cache Performance

### API Call Reduction

**First Load (Cache Miss):**
- ~40 API calls to GitHub
- Data cached for subsequent requests

**Subsequent Loads (Cache Hit):**
- **0 API calls to GitHub** (served from cache)
- Instant response time

**Estimated Reduction:**
- **95%+ reduction in API calls**
- From 480 calls/hour to ~24 calls/hour per user

### Cache Monitoring

**Cache Status API:** `/api/cache/status`
```bash
# Get cache statistics
GET /api/cache/status

# Clear cache (for development)
DELETE /api/cache/status
```

**Response:**
```json
{
  "cacheSize": 12,
  "cachedKeys": [
    "repo:All-Hands-AI/OpenHands",
    "org:All-Hands-AI",
    "contributors:All-Hands-AI/OpenHands",
    "dashboard:All-Hands-AI/OpenHands:All-Hands-AI"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Production Considerations

### Scaling Beyond Memory Cache

For production deployment, consider upgrading to:

1. **Redis Cache**
   ```typescript
   // Replace lib/cache.ts with Redis implementation
   import Redis from 'ioredis'
   const redis = new Redis(process.env.REDIS_URL)
   ```

2. **Database Caching**
   ```sql
   CREATE TABLE cache_entries (
     key VARCHAR(255) PRIMARY KEY,
     data JSON,
     expires_at TIMESTAMP
   );
   ```

3. **CDN/Edge Caching**
   - Vercel Edge Functions
   - Cloudflare Workers
   - AWS CloudFront

### Cache Invalidation

**Manual Cache Clearing:**
```bash
# Clear all cache
curl -X DELETE /api/cache/status

# Or programmatically
cache.clear()
```

**Webhook-Based Invalidation:**
```typescript
// GitHub webhook endpoint
export async function POST(request: Request) {
  const event = request.headers.get('x-github-event')
  
  if (event === 'push' || event === 'pull_request') {
    // Invalidate relevant cache entries
    cache.delete(CacheKeys.recentCommits(OWNER, REPO))
    cache.delete(CacheKeys.dashboardData(OWNER, REPO, ORG))
  }
}
```

### Environment Variables

```env
# Cache configuration
CACHE_TTL_REPOSITORY=30
CACHE_TTL_ORGANIZATION=60
CACHE_TTL_CONTRIBUTORS=15
CACHE_TTL_RECENT_ACTIVITY=5

# Redis (for production)
REDIS_URL=redis://localhost:6379
```

## Monitoring & Debugging

### Cache Hit Rates

Monitor cache performance in logs:
```
Cache hit for repo:All-Hands-AI/OpenHands
Cache miss for contributors:All-Hands-AI/OpenHands, fetching...
```

### Performance Metrics

Track these metrics:
- Cache hit rate percentage
- Average response time (cached vs uncached)
- GitHub API rate limit usage
- Memory usage (for in-memory cache)

### Development Tools

```bash
# Check cache status
curl http://localhost:12000/api/cache/status

# Clear cache during development
curl -X DELETE http://localhost:12000/api/cache/status

# Monitor API calls in browser DevTools Network tab
```

## Best Practices

1. **Cache Layering**: Use both server-side and client-side caching
2. **Appropriate TTLs**: Balance freshness vs API usage
3. **Cache Warming**: Pre-populate cache for critical data
4. **Graceful Degradation**: Handle cache failures gracefully
5. **Monitoring**: Track cache performance and API usage
6. **Invalidation Strategy**: Clear cache when data changes

This caching strategy reduces GitHub API usage by 95%+ while maintaining data freshness and user experience.