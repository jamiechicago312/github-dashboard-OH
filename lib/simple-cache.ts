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

/**
 * Get the next top of hour in UTC
 */
function getNextTopOfHourUTC(): Date {
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0) // Next hour, 0 minutes, 0 seconds, 0 milliseconds
  return nextHour
}

/**
 * Get the last top of hour in UTC
 */
function getLastTopOfHourUTC(): Date {
  const now = new Date()
  const lastHour = new Date(now)
  lastHour.setUTCHours(now.getUTCHours(), 0, 0, 0) // Current hour, 0 minutes, 0 seconds, 0 milliseconds
  return lastHour
}

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
   * Get cached data if it exists and was refreshed in the current hour (UTC)
   */
  static async get<T>(): Promise<T | null> {
    try {
      await ensureCacheDir()
      const fileContent = await fs.readFile(CACHE_FILE, 'utf-8')
      const cached: CachedData<T> = JSON.parse(fileContent)
      
      const now = new Date()
      const lastTopOfHour = getLastTopOfHourUTC()
      const refreshTime = new Date(cached.lastRefresh)
      
      // Check if data was refreshed in the current hour (after the last top of hour)
      if (refreshTime >= lastTopOfHour) {
        const timeSinceRefresh = now.getTime() - cached.lastRefresh
        console.log(`Cache hit: Data is ${Math.round(timeSinceRefresh / 1000 / 60)} minutes old`)
        return cached.data
      } else {
        const timeSinceRefresh = now.getTime() - cached.lastRefresh
        console.log(`Cache expired: Data is ${Math.round(timeSinceRefresh / 1000 / 60)} minutes old (from previous hour)`)
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
   * Get time until next refresh is allowed (next top of hour UTC)
   */
  static async getTimeUntilNextRefresh(): Promise<number> {
    const now = new Date()
    const nextTopOfHour = getNextTopOfHourUTC()
    return nextTopOfHour.getTime() - now.getTime()
  }

  /**
   * Check if refresh is allowed (we're at or past the top of a new hour UTC)
   */
  static async canRefresh(): Promise<boolean> {
    try {
      await ensureCacheDir()
      const fileContent = await fs.readFile(CACHE_FILE, 'utf-8')
      const cached: CachedData<any> = JSON.parse(fileContent)
      
      const now = new Date()
      const lastTopOfHour = getLastTopOfHourUTC()
      const refreshTime = new Date(cached.lastRefresh)
      
      // Can refresh if we haven't refreshed in the current hour yet
      return refreshTime < lastTopOfHour
    } catch (error) {
      // No cache file, can refresh immediately
      return true
    }
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
      const canRefresh = await this.canRefresh()
      const nextTopOfHour = getNextTopOfHourUTC()
      
      return {
        hasCache: true,
        lastRefresh: new Date(cached.lastRefresh),
        nextRefreshAvailable: canRefresh ? new Date() : nextTopOfHour,
        canRefresh,
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