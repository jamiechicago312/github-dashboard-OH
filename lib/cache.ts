/**
 * Simple in-memory cache for GitHub API responses
 * In production, you'd want to use Redis or similar
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000 // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Global cache instance
export const cache = new MemoryCache()

// Cache key generators
export const CacheKeys = {
  repository: (owner: string, repo: string) => `repo:${owner}/${repo}`,
  organization: (org: string) => `org:${org}`,
  contributors: (owner: string, repo: string) => `contributors:${owner}/${repo}`,
  orgMembers: (org: string) => `org-members:${org}`,
  recentCommits: (owner: string, repo: string) => `commits:${owner}/${repo}`,
  recentPRs: (owner: string, repo: string) => `prs:${owner}/${repo}`,
  recentIssues: (owner: string, repo: string) => `issues:${owner}/${repo}`,
  releases: (owner: string, repo: string) => `releases:${owner}/${repo}`,
  repoStats: (owner: string, repo: string) => `repo-stats:${owner}/${repo}`,
  orgStats: (org: string) => `org-stats:${org}`,
  dashboardData: (owner: string, repo: string, org: string) => `dashboard:${owner}/${repo}:${org}`,
  contributorDetails: (username: string) => `contributor-details:${username}`,
}

// Cache TTL configurations (in minutes)
export const CacheTTL = {
  repository: 30,        // Repository info changes infrequently
  organization: 60,      // Organization info changes very infrequently  
  contributors: 15,      // Contributors can change more frequently
  orgMembers: 60,        // Organization members change infrequently
  recentActivity: 5,     // Recent commits, PRs, issues change frequently
  releases: 30,          // Releases don't change often
  stats: 10,             // Statistics are expensive to calculate
  dashboardData: 5,      // Overall dashboard data
  contributorDetails: 120, // User details change very infrequently
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
  cache.cleanup()
}, 10 * 60 * 1000)