/**
 * Simple cache for GitHub dashboard data
 * Stores data with timestamp, refreshes max once per hour
 */

interface CachedData<T> {
  data: T
  lastRefresh: number // Unix timestamp
}

// For Vercel deployment, you can use Vercel KV (Redis-like)
// For now, using a simple file-based approach that works locally and on Vercel
import { promises as fs } from 'fs'
import path from 'path'

const CACHE_FILE = path.join(process.cwd(), '.cache', 'dashboard-data.json')
const REFRESH_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

// Ensure cache directory exists
async function ensureCacheDir() {
  const cacheDir = path.dirname(CACHE_FILE)
  try {
    await fs.mkdir(cacheDir, { recursive: true })
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

export class SimpleCache {
  /**
   * Get cached data if it exists and is less than 1 hour old
   */
  static async get<T>(): Promise<T | null> {
    try {
      await ensureCacheDir()
      const fileContent = await fs.readFile(CACHE_FILE, 'utf-8')
      const cached: CachedData<T> = JSON.parse(fileContent)
      
      const now = Date.now()
      const timeSinceRefresh = now - cached.lastRefresh
      
      if (timeSinceRefresh < REFRESH_INTERVAL) {
        console.log(`Cache hit: Data is ${Math.round(timeSinceRefresh / 1000 / 60)} minutes old`)
        return cached.data
      } else {
        console.log(`Cache expired: Data is ${Math.round(timeSinceRefresh / 1000 / 60)} minutes old`)
        return null
      }
    } catch (error) {
      console.log('Cache miss: No cached data found')
      return null
    }
  }

  /**
   * Store data with current timestamp
   */
  static async set<T>(data: T): Promise<void> {
    try {
      await ensureCacheDir()
      const cached: CachedData<T> = {
        data,
        lastRefresh: Date.now()
      }
      await fs.writeFile(CACHE_FILE, JSON.stringify(cached, null, 2))
      console.log('Data cached successfully')
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }

  /**
   * Get time until next refresh is allowed
   */
  static async getTimeUntilNextRefresh(): Promise<number> {
    try {
      await ensureCacheDir()
      const fileContent = await fs.readFile(CACHE_FILE, 'utf-8')
      const cached: CachedData<any> = JSON.parse(fileContent)
      
      const now = Date.now()
      const timeSinceRefresh = now - cached.lastRefresh
      const timeUntilNext = REFRESH_INTERVAL - timeSinceRefresh
      
      return Math.max(0, timeUntilNext)
    } catch (error) {
      return 0 // No cache, can refresh immediately
    }
  }

  /**
   * Check if refresh is allowed (more than 1 hour since last refresh)
   */
  static async canRefresh(): Promise<boolean> {
    const timeUntilNext = await this.getTimeUntilNextRefresh()
    return timeUntilNext === 0
  }

  /**
   * Get cache status for UI
   */
  static async getStatus(): Promise<{
    hasCache: boolean
    lastRefresh: Date | null
    nextRefreshAvailable: Date | null
    canRefresh: boolean
    timeUntilNextRefresh: number
  }> {
    try {
      await ensureCacheDir()
      const fileContent = await fs.readFile(CACHE_FILE, 'utf-8')
      const cached: CachedData<any> = JSON.parse(fileContent)
      
      const timeUntilNext = await this.getTimeUntilNextRefresh()
      
      return {
        hasCache: true,
        lastRefresh: new Date(cached.lastRefresh),
        nextRefreshAvailable: timeUntilNext > 0 ? new Date(Date.now() + timeUntilNext) : new Date(),
        canRefresh: timeUntilNext === 0,
        timeUntilNextRefresh: timeUntilNext
      }
    } catch (error) {
      return {
        hasCache: false,
        lastRefresh: null,
        nextRefreshAvailable: new Date(),
        canRefresh: true,
        timeUntilNextRefresh: 0
      }
    }
  }

  /**
   * Clear cache (for development)
   */
  static async clear(): Promise<void> {
    try {
      await fs.unlink(CACHE_FILE)
      console.log('Cache cleared')
    } catch (error) {
      // File might not exist, ignore error
    }
  }
}