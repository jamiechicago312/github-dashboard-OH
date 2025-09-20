import { MetricsCollector } from '@/lib/metrics-collector'
import { GitHubAPI } from '@/lib/github-api'
import DatabaseAdapter from '@/lib/database-adapter'

// Mock dependencies
jest.mock('@/lib/github-api')
jest.mock('@/lib/database-adapter')

const mockGitHubAPI = GitHubAPI as jest.Mocked<typeof GitHubAPI>
const mockDatabaseAdapter = DatabaseAdapter as jest.Mocked<typeof DatabaseAdapter>

// Mock environment variables
const originalEnv = process.env
beforeAll(() => {
  process.env = { 
    ...originalEnv, 
    GITHUB_OWNER: 'All-Hands-AI',
    GITHUB_REPO: 'OpenHands'
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('MetricsCollector', () => {
  let collector: MetricsCollector

  beforeEach(() => {
    jest.clearAllMocks()
    collector = MetricsCollector.getInstance()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MetricsCollector.getInstance()
      const instance2 = MetricsCollector.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('collectCurrentMetrics', () => {
    const mockAllTimeStats = {
      stars: 1000,
      forks: 500,
      contributors: 100,
      commits: 5000,
      releases: 50,
      issues: {
        open: 25,
        closed: 475,
        total: 500
      },
      pullRequests: {
        open: 10,
        closed: 240,
        merged: 200,
        total: 250
      }
    }

    beforeEach(() => {
      mockGitHubAPI.getAllTimeRepositoryStats = jest.fn().mockResolvedValue(mockAllTimeStats)
      mockDatabaseAdapter.storeMetrics = jest.fn().mockResolvedValue(undefined)
    })

    it('should collect and store metrics successfully', async () => {
      const result = await collector.collectCurrentMetrics()

      expect(mockGitHubAPI.getAllTimeRepositoryStats).toHaveBeenCalledWith('All-Hands-AI', 'OpenHands')
      expect(mockDatabaseAdapter.storeMetrics).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        stars: 1000,
        forks: 500,
        contributors: 100,
        commits: 5000,
        releases: 50,
        open_issues: 25,
        closed_issues: 475,
        open_prs: 10,
        closed_prs: 240,
        merged_prs: 200
      })

      expect(result).toEqual({
        id: expect.any(Number),
        timestamp: expect.any(Number),
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        stars: 1000,
        forks: 500,
        contributors: 100,
        commits: 5000,
        releases: 50,
        open_issues: 25,
        closed_issues: 475,
        open_prs: 10,
        closed_prs: 240,
        merged_prs: 200
      })
    })

    it('should handle GitHub API errors', async () => {
      mockGitHubAPI.getAllTimeRepositoryStats = jest.fn().mockRejectedValue(new Error('GitHub API Error'))

      await expect(collector.collectCurrentMetrics()).rejects.toThrow('GitHub API Error')
      expect(mockDatabaseAdapter.storeMetrics).not.toHaveBeenCalled()
    })

    it('should handle database storage errors', async () => {
      mockDatabaseAdapter.storeMetrics = jest.fn().mockRejectedValue(new Error('Database Error'))

      await expect(collector.collectCurrentMetrics()).rejects.toThrow('Database Error')
    })

    it('should validate metrics before storing', async () => {
      const invalidStats = {
        ...mockAllTimeStats,
        stars: NaN, // Invalid value
      }
      mockGitHubAPI.getAllTimeRepositoryStats = jest.fn().mockResolvedValue(invalidStats)

      await expect(collector.collectCurrentMetrics()).rejects.toThrow('Invalid metrics data collected')
      expect(mockDatabaseAdapter.storeMetrics).not.toHaveBeenCalled()
    })

    it('should reject negative values', async () => {
      const invalidStats = {
        ...mockAllTimeStats,
        stars: -10, // Negative value
      }
      mockGitHubAPI.getAllTimeRepositoryStats = jest.fn().mockResolvedValue(invalidStats)

      await expect(collector.collectCurrentMetrics()).rejects.toThrow('Invalid metrics data collected')
    })

    it('should reject inconsistent PR data', async () => {
      const invalidStats = {
        ...mockAllTimeStats,
        pullRequests: {
          open: 10,
          closed: 100,
          merged: 150, // More merged than closed
          total: 110
        }
      }
      mockGitHubAPI.getAllTimeRepositoryStats = jest.fn().mockResolvedValue(invalidStats)

      await expect(collector.collectCurrentMetrics()).rejects.toThrow('Invalid metrics data collected')
    })
  })

  describe('hasCollectedToday', () => {
    it('should return true when metrics collected today', async () => {
      const today = new Date().toISOString().split('T')[0]
      mockDatabaseAdapter.getLatestMetrics = jest.fn().mockResolvedValue({
        id: 1,
        date: today,
        timestamp: Date.now()
      })

      const result = await collector.hasCollectedToday()

      expect(result).toBe(true)
    })

    it('should return false when no metrics collected today', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      mockDatabaseAdapter.getLatestMetrics = jest.fn().mockResolvedValue({
        id: 1,
        date: yesterday,
        timestamp: Date.now() - 24 * 60 * 60 * 1000
      })

      const result = await collector.hasCollectedToday()

      expect(result).toBe(false)
    })

    it('should return false when no metrics exist', async () => {
      mockDatabaseAdapter.getLatestMetrics = jest.fn().mockResolvedValue(null)

      const result = await collector.hasCollectedToday()

      expect(result).toBe(false)
    })
  })

  describe('collectIfNeeded', () => {
    it('should skip collection if already collected today', async () => {
      const today = new Date().toISOString().split('T')[0]
      const existingMetrics = {
        id: 1,
        date: today,
        timestamp: Date.now(),
        stars: 500
      }
      
      mockDatabaseAdapter.getLatestMetrics = jest.fn().mockResolvedValue(existingMetrics)

      const result = await collector.collectIfNeeded()

      expect(result).toEqual(existingMetrics)
      expect(mockGitHubAPI.getAllTimeRepositoryStats).not.toHaveBeenCalled()
    })

    it('should collect metrics if not collected today', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      mockDatabaseAdapter.getLatestMetrics = jest.fn().mockResolvedValue({
        id: 1,
        date: yesterday,
        timestamp: Date.now() - 24 * 60 * 60 * 1000
      })

      const mockAllTimeStats = {
        stars: 1000,
        forks: 500,
        contributors: 100,
        commits: 5000,
        releases: 50,
        issues: { open: 25, closed: 475, total: 500 },
        pullRequests: { open: 10, closed: 240, merged: 200, total: 250 }
      }

      mockGitHubAPI.getAllTimeRepositoryStats = jest.fn().mockResolvedValue(mockAllTimeStats)
      mockDatabaseAdapter.storeMetrics = jest.fn().mockResolvedValue(undefined)

      const result = await collector.collectIfNeeded()

      expect(mockGitHubAPI.getAllTimeRepositoryStats).toHaveBeenCalled()
      expect(mockDatabaseAdapter.storeMetrics).toHaveBeenCalled()
      expect(result?.stars).toBe(1000)
    })
  })

  describe('getLatestMetrics', () => {
    it('should return latest metrics from database', async () => {
      const mockMetrics = {
        id: 1,
        timestamp: Date.now(),
        date: '2022-01-01',
        stars: 1000
      }

      mockDatabaseAdapter.getLatestMetrics = jest.fn().mockResolvedValue(mockMetrics)

      const result = await collector.getLatestMetrics()

      expect(result).toEqual(mockMetrics)
      expect(mockDatabaseAdapter.getLatestMetrics).toHaveBeenCalled()
    })
  })

  describe('getHistoricalTrends', () => {
    it('should return historical trends from database', async () => {
      const mockTrends = {
        current: { stars: 1000, forks: 500, contributors: 100 },
        previous: { stars: 900, forks: 450, contributors: 90 },
        change: { stars: 100, forks: 50, contributors: 10 }
      }

      mockDatabaseAdapter.getTimeRangeMetrics = jest.fn().mockResolvedValue(mockTrends)

      const result = await collector.getHistoricalTrends(30)

      expect(result).toEqual(mockTrends)
      expect(mockDatabaseAdapter.getTimeRangeMetrics).toHaveBeenCalledWith(30)
    })

    it('should use default days parameter', async () => {
      mockDatabaseAdapter.getTimeRangeMetrics = jest.fn().mockResolvedValue(null)

      await collector.getHistoricalTrends()

      expect(mockDatabaseAdapter.getTimeRangeMetrics).toHaveBeenCalledWith(30)
    })
  })

  describe('cleanupOldMetrics', () => {
    it('should cleanup old metrics with default retention', async () => {
      mockDatabaseAdapter.cleanupOldMetrics = jest.fn().mockResolvedValue(undefined)

      await collector.cleanupOldMetrics()

      expect(mockDatabaseAdapter.cleanupOldMetrics).toHaveBeenCalled()
    })

    it('should cleanup old metrics with custom retention', async () => {
      mockDatabaseAdapter.cleanupOldMetrics = jest.fn().mockResolvedValue(undefined)

      await collector.cleanupOldMetrics(180)

      expect(mockDatabaseAdapter.cleanupOldMetrics).toHaveBeenCalled()
    })
  })

  describe('collectAndStore', () => {
    it('should be an alias for collectCurrentMetrics', async () => {
      const mockAllTimeStats = {
        stars: 1000,
        forks: 500,
        contributors: 100,
        commits: 5000,
        releases: 50,
        issues: { open: 25, closed: 475, total: 500 },
        pullRequests: { open: 10, closed: 240, merged: 200, total: 250 }
      }

      mockGitHubAPI.getAllTimeRepositoryStats = jest.fn().mockResolvedValue(mockAllTimeStats)
      mockDatabaseAdapter.storeMetrics = jest.fn().mockResolvedValue(undefined)

      const result = await collector.collectAndStore()

      expect(mockGitHubAPI.getAllTimeRepositoryStats).toHaveBeenCalled()
      expect(mockDatabaseAdapter.storeMetrics).toHaveBeenCalled()
      expect(result.stars).toBe(1000)
    })
  })

  describe('getHealthStatus', () => {
    it('should return healthy status when metrics are recent', async () => {
      const recentTimestamp = Date.now() - (12 * 60 * 60 * 1000) // 12 hours ago
      mockDatabaseAdapter.getLatestMetrics = jest.fn().mockResolvedValue({
        id: 1,
        timestamp: recentTimestamp,
        date: '2022-01-01'
      })

      const result = await collector.getHealthStatus()

      expect(result.isHealthy).toBe(true)
      expect(result.lastCollection).toEqual(new Date(recentTimestamp))
      expect(result.message).toContain('12 hours ago')
    })

    it('should return unhealthy status when metrics are stale', async () => {
      const staleTimestamp = Date.now() - (30 * 60 * 60 * 1000) // 30 hours ago
      mockDatabaseAdapter.getLatestMetrics = jest.fn().mockResolvedValue({
        id: 1,
        timestamp: staleTimestamp,
        date: '2022-01-01'
      })

      const result = await collector.getHealthStatus()

      expect(result.isHealthy).toBe(false)
      expect(result.lastCollection).toEqual(new Date(staleTimestamp))
      expect(result.message).toContain('30 hours ago (stale)')
    })

    it('should return unhealthy status when no metrics exist', async () => {
      mockDatabaseAdapter.getLatestMetrics = jest.fn().mockResolvedValue(null)

      const result = await collector.getHealthStatus()

      expect(result.isHealthy).toBe(false)
      expect(result.lastCollection).toBeNull()
      expect(result.message).toBe('No metrics collected yet')
    })
  })

  describe('metrics validation', () => {
    it('should validate all required fields are numbers', () => {
      const validMetrics = {
        stars: 100,
        forks: 50,
        contributors: 25,
        commits: 1000,
        releases: 10,
        open_issues: 5,
        closed_issues: 95,
        open_prs: 3,
        closed_prs: 47,
        merged_prs: 40
      }

      // Access private method through any cast for testing
      const isValid = (collector as any).validateMetrics(validMetrics)
      expect(isValid).toBe(true)
    })

    it('should reject metrics with missing fields', () => {
      const invalidMetrics = {
        stars: 100,
        forks: 50,
        // missing other required fields
      }

      const isValid = (collector as any).validateMetrics(invalidMetrics)
      expect(isValid).toBe(false)
    })

    it('should reject metrics with non-numeric values', () => {
      const invalidMetrics = {
        stars: 'not a number',
        forks: 50,
        contributors: 25,
        commits: 1000,
        releases: 10,
        open_issues: 5,
        closed_issues: 95,
        open_prs: 3,
        closed_prs: 47,
        merged_prs: 40
      }

      const isValid = (collector as any).validateMetrics(invalidMetrics)
      expect(isValid).toBe(false)
    })

    it('should reject metrics with NaN values', () => {
      const invalidMetrics = {
        stars: NaN,
        forks: 50,
        contributors: 25,
        commits: 1000,
        releases: 10,
        open_issues: 5,
        closed_issues: 95,
        open_prs: 3,
        closed_prs: 47,
        merged_prs: 40
      }

      const isValid = (collector as any).validateMetrics(invalidMetrics)
      expect(isValid).toBe(false)
    })

    it('should reject metrics with negative values', () => {
      const invalidMetrics = {
        stars: -10,
        forks: 50,
        contributors: 25,
        commits: 1000,
        releases: 10,
        open_issues: 5,
        closed_issues: 95,
        open_prs: 3,
        closed_prs: 47,
        merged_prs: 40
      }

      const isValid = (collector as any).validateMetrics(invalidMetrics)
      expect(isValid).toBe(false)
    })

    it('should reject metrics where merged PRs exceed closed PRs', () => {
      const invalidMetrics = {
        stars: 100,
        forks: 50,
        contributors: 25,
        commits: 1000,
        releases: 10,
        open_issues: 5,
        closed_issues: 95,
        open_prs: 3,
        closed_prs: 40,
        merged_prs: 50 // More merged than closed
      }

      const isValid = (collector as any).validateMetrics(invalidMetrics)
      expect(isValid).toBe(false)
    })
  })
})