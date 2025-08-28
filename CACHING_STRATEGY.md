# Simple Caching Strategy

## Overview

This GitHub dashboard uses a simple, effective caching strategy to prevent API rate limiting while providing excellent user experience.

## How It Works

### 🔄 **Refresh on Visit, Max Once Per Hour**
- Data refreshes automatically when someone visits the dashboard
- **Rate Limit**: Maximum 1 refresh per hour (prevents API abuse)
- Subsequent visits within the hour serve cached data instantly

### 📊 **API Usage Reduction**
- **Before**: ~40 API calls per visit × multiple visits = 400+ calls/hour
- **After**: Maximum 40 API calls per hour (one refresh max)
- **95%+ reduction** in GitHub API usage

### 🎯 **User Experience**
- **Countdown Timer**: Shows time until next refresh is available
- **Manual Refresh**: Users can trigger refresh (if allowed)
- **Rate Limit Message**: Clear feedback when refresh is blocked
- **Cache Status**: Shows when data was last updated

## Technical Implementation

### Server-Side Caching
```typescript
// Simple file-based cache (works on Vercel)
await SimpleCache.set(dashboardData)  // Cache for 1 hour
const cached = await SimpleCache.get() // Get if < 1 hour old
```

### Client-Side Integration
```typescript
// Disable automatic SWR refresh, handle manually
refreshInterval: 0
revalidateOnFocus: false
```

### Rate Limiting
```typescript
// POST /api/github/refresh
if (!canRefresh) {
  return 429 // Too Many Requests
}
```

## Cache Storage Options

### Current: File-Based (Simple)
- ✅ Works locally and on Vercel
- ✅ No external dependencies
- ✅ Perfect for small projects
- ⚠️ Single instance only

### Future: Vercel KV (Recommended for Production)
```bash
# Add to your Vercel project
npm install @vercel/kv
```

```typescript
// Replace SimpleCache with Vercel KV
import { kv } from '@vercel/kv'
await kv.set('dashboard', data, { ex: 3600 }) // 1 hour TTL
```

### Alternative: Upstash Redis (Free Tier)
- ✅ Free tier available
- ✅ Works with any hosting provider
- ✅ Persistent across deployments

## Benefits

1. **Prevents Rate Limiting**: Never exceeds GitHub API limits
2. **Fast Performance**: Instant responses for cached data
3. **Simple Implementation**: Easy to understand and maintain
4. **Great UX**: Clear feedback and countdown timers
5. **Cost Effective**: Minimal infrastructure requirements

## Monitoring

- **Cache Status**: `/api/github/refresh` (GET)
- **Manual Refresh**: `/api/github/refresh` (POST)
- **Dashboard Data**: `/api/github/dashboard` (includes cache info)

## Production Recommendations

1. **Use Vercel KV** for multi-instance deployments
2. **Add webhook invalidation** for real-time updates
3. **Monitor API usage** in GitHub settings
4. **Consider CDN caching** for static assets

This approach provides the perfect balance of performance, reliability, and simplicity for a small GitHub dashboard project.