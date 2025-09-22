import { DatabaseAdapter } from '@/lib/database-adapter'
import { getDatabase, getDatabaseType } from '@/config/database'

// Mock dependencies
jest.mock('@/config/database')

const mockGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>
const mockGetDatabaseType = getDatabaseType as jest.MockedFunction<typeof getDatabaseType>

describe('DatabaseAdapter', () => {
  let adapter: DatabaseAdapter
  let mockDatabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create a mock database instance
    mockDatabase = {
      storeMetrics: jest.fn(),
      getLatestMetrics: jest.fn(),
      getMetricsInRange: jest.fn(),
      getTimeRangeMetrics: jest.fn(),
      getAvailableDates: jest.fn(),
      getMetricsForTrends: jest.fn(),
      cleanupOldMetrics: jest.fn(),
      getHealthStatus: jest.fn(),
      close: jest.fn()
    }

    mockGetDatabase.mockReturnValue(mockDatabase)
    
    // Reset the singleton instance to ensure fresh state
    ;(DatabaseAdapter as any).instance = null
    adapter = DatabaseAdapter.getInstance()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseAdapter.getInstance()
      const instance2 = DatabaseAdapter.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('PostgreSQL database operations', () => {
    beforeEach(() => {
      mockGetDatabaseType.mockReturnValue('postgresql')
    })

    describe('storeMetrics', () => {
      it('should call async storeMetrics for PostgreSQL', async () => {
        const metrics = {
          timestamp: Date.now(),
          date: '2022-01-01',
          stars: 100,
          forks: 50,
          contributors: 25,
          open_issues: 10,
          closed_issues: 90,
          open_prs: 5,
          closed_prs: 45,
          merged_prs: 40,
          commits: 1000,
          releases: 10
        }

        mockDatabase.storeMetrics.mockResolvedValue(undefined)

        await adapter.storeMetrics(metrics)

        expect(mockDatabase.storeMetrics).toHaveBeenCalledWith(metrics)
      })

      it('should handle PostgreSQL storage errors', async () => {
        const metrics = { timestamp: Date.now(), date: '2022-01-01', stars: 100 } as any
        mockDatabase.storeMetrics.mockRejectedValue(new Error('Storage failed'))

        await expect(adapter.storeMetrics(metrics)).rejects.toThrow('Storage failed')
      })
    })

    describe('getLatestMetrics', () => {
      it('should call async getLatestMetrics for PostgreSQL', async () => {
        const mockMetrics = {
          id: 1,
          timestamp: Date.now(),
          date: '2022-01-01',
          stars: 100
        }

        mockDatabase.getLatestMetrics.mockResolvedValue(mockMetrics)

        const result = await adapter.getLatestMetrics()

        expect(result).toEqual(mockMetrics)
        expect(mockDatabase.getLatestMetrics).toHaveBeenCalled()
      })

      it('should return null when no metrics exist', async () => {
        mockDatabase.getLatestMetrics.mockResolvedValue(null)

        const result = await adapter.getLatestMetrics()

        expect(result).toBeNull()
      })
    })

    describe('getMetricsInRange', () => {
      it('should call async getMetricsInRange for PostgreSQL', async () => {
        const mockMetrics = [
          { id: 1, timestamp: Date.now(), date: '2022-01-01', stars: 100 },
          { id: 2, timestamp: Date.now(), date: '2022-01-02', stars: 105 }
        ]

        mockDatabase.getMetricsInRange.mockResolvedValue(mockMetrics)

        const result = await adapter.getMetricsInRange('2022-01-01', '2022-01-02')

        expect(result).toEqual(mockMetrics)
        expect(mockDatabase.getMetricsInRange).toHaveBeenCalledWith('2022-01-01', '2022-01-02')
      })
    })

    describe('getTimeRangeMetrics', () => {
      it('should call async getTimeRangeMetrics for PostgreSQL', async () => {
        const mockTrends = {
          current: { stars: 100, forks: 50, contributors: 25 },
          previous: { stars: 90, forks: 45, contributors: 20 },
          change: { stars: 10, forks: 5, contributors: 5 }
        }

        mockDatabase.getTimeRangeMetrics.mockResolvedValue(mockTrends)

        const result = await adapter.getTimeRangeMetrics(7)

        expect(result).toEqual(mockTrends)
        expect(mockDatabase.getTimeRangeMetrics).toHaveBeenCalledWith(7)
      })
    })

    describe('getAvailableDates', () => {
      it('should call async getAvailableDates for PostgreSQL', async () => {
        const mockDates = ['2022-01-01', '2022-01-02', '2022-01-03']

        mockDatabase.getAvailableDates.mockResolvedValue(mockDates)

        const result = await adapter.getAvailableDates()

        expect(result).toEqual(mockDates)
        expect(mockDatabase.getAvailableDates).toHaveBeenCalled()
      })
    })

    describe('getMetricsForTrends', () => {
      it('should call async getMetricsForTrends for PostgreSQL', async () => {
        const mockMetrics = [
          { id: 1, timestamp: Date.now(), date: '2022-01-01', stars: 100 }
        ]

        mockDatabase.getMetricsForTrends.mockResolvedValue(mockMetrics)

        const result = await adapter.getMetricsForTrends(30)

        expect(result).toEqual(mockMetrics)
        expect(mockDatabase.getMetricsForTrends).toHaveBeenCalledWith(30)
      })
    })

    describe('cleanupOldMetrics', () => {
      it('should call async cleanupOldMetrics for PostgreSQL', async () => {
        mockDatabase.cleanupOldMetrics.mockResolvedValue(undefined)

        await adapter.cleanupOldMetrics()

        expect(mockDatabase.cleanupOldMetrics).toHaveBeenCalled()
      })
    })

    describe('getHealthStatus', () => {
      it('should call async getHealthStatus for PostgreSQL', async () => {
        const mockHealth = {
          isHealthy: true,
          lastCollection: '2022-01-01T00:00:00Z',
          recordCount: 100,
          oldestRecord: '2022-01-01',
          newestRecord: '2022-12-31'
        }

        mockDatabase.getHealthStatus.mockResolvedValue(mockHealth)

        const result = await adapter.getHealthStatus()

        expect(result).toEqual(mockHealth)
        expect(mockDatabase.getHealthStatus).toHaveBeenCalled()
      })
    })

    describe('close', () => {
      it('should call async close for PostgreSQL', async () => {
        mockDatabase.close.mockResolvedValue(undefined)

        await adapter.close()

        expect(mockDatabase.close).toHaveBeenCalled()
      })
    })
  })

  describe('SQLite database operations', () => {
    beforeEach(() => {
      mockGetDatabaseType.mockReturnValue('sqlite')
    })

    describe('storeMetrics', () => {
      it('should call sync storeMetrics for SQLite', async () => {
        const metrics = {
          timestamp: Date.now(),
          date: '2022-01-01',
          stars: 100,
          forks: 50,
          contributors: 25,
          open_issues: 10,
          closed_issues: 90,
          open_prs: 5,
          closed_prs: 45,
          merged_prs: 40,
          commits: 1000,
          releases: 10
        }

        mockDatabase.storeMetrics.mockReturnValue(undefined)

        await adapter.storeMetrics(metrics)

        expect(mockDatabase.storeMetrics).toHaveBeenCalledWith(metrics)
      })
    })

    describe('getLatestMetrics', () => {
      it('should call sync getLatestMetrics for SQLite', async () => {
        const mockMetrics = {
          id: 1,
          timestamp: Date.now(),
          date: '2022-01-01',
          stars: 100
        }

        mockDatabase.getLatestMetrics.mockReturnValue(mockMetrics)

        const result = await adapter.getLatestMetrics()

        expect(result).toEqual(mockMetrics)
        expect(mockDatabase.getLatestMetrics).toHaveBeenCalled()
      })
    })

    describe('getMetricsInRange', () => {
      it('should call sync getMetricsInRange for SQLite', async () => {
        const mockMetrics = [
          { id: 1, timestamp: Date.now(), date: '2022-01-01', stars: 100 }
        ]

        mockDatabase.getMetricsInRange.mockReturnValue(mockMetrics)

        const result = await adapter.getMetricsInRange('2022-01-01', '2022-01-02')

        expect(result).toEqual(mockMetrics)
        expect(mockDatabase.getMetricsInRange).toHaveBeenCalledWith('2022-01-01', '2022-01-02')
      })
    })

    describe('getTimeRangeMetrics', () => {
      it('should call sync getTimeRangeMetrics for SQLite', async () => {
        const mockTrends = {
          current: { stars: 100, forks: 50, contributors: 25 },
          previous: { stars: 90, forks: 45, contributors: 20 },
          change: { stars: 10, forks: 5, contributors: 5 }
        }

        mockDatabase.getTimeRangeMetrics.mockReturnValue(mockTrends)

        const result = await adapter.getTimeRangeMetrics(7)

        expect(result).toEqual(mockTrends)
        expect(mockDatabase.getTimeRangeMetrics).toHaveBeenCalledWith(7)
      })
    })

    describe('getAvailableDates', () => {
      it('should call sync getAvailableDates for SQLite', async () => {
        const mockDates = ['2022-01-01', '2022-01-02', '2022-01-03']

        mockDatabase.getAvailableDates.mockReturnValue(mockDates)

        const result = await adapter.getAvailableDates()

        expect(result).toEqual(mockDates)
        expect(mockDatabase.getAvailableDates).toHaveBeenCalled()
      })
    })

    describe('getMetricsForTrends', () => {
      it('should use getMetricsInRange for SQLite (fallback)', async () => {
        const mockMetrics = [
          { id: 1, timestamp: Date.now(), date: '2022-01-01', stars: 100 }
        ]

        mockDatabase.getMetricsInRange.mockReturnValue(mockMetrics)

        const result = await adapter.getMetricsForTrends(30)

        expect(result).toEqual(mockMetrics)
        expect(mockDatabase.getMetricsInRange).toHaveBeenCalledWith(
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), // Start date
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)  // End date
        )
      })

      it('should calculate correct date range for SQLite fallback', async () => {
        const mockMetrics = []
        mockDatabase.getMetricsInRange.mockReturnValue(mockMetrics)

        const now = new Date()
        const expectedEndDate = now.toISOString().split('T')[0]
        const expectedStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        await adapter.getMetricsForTrends(30)

        expect(mockDatabase.getMetricsInRange).toHaveBeenCalledWith(expectedStartDate, expectedEndDate)
      })
    })

    describe('cleanupOldMetrics', () => {
      it('should call sync cleanupOldMetrics for SQLite', async () => {
        mockDatabase.cleanupOldMetrics.mockReturnValue(undefined)

        await adapter.cleanupOldMetrics()

        expect(mockDatabase.cleanupOldMetrics).toHaveBeenCalled()
      })
    })

    describe('getHealthStatus', () => {
      it('should implement health status manually for SQLite', async () => {
        const mockLatest = {
          id: 1,
          timestamp: Date.now(),
          date: '2022-01-01',
          created_at: '2022-01-01T00:00:00Z'
        }
        const mockDates = ['2022-01-01', '2022-01-02', '2022-01-03']

        mockDatabase.getLatestMetrics.mockReturnValue(mockLatest)
        mockDatabase.getAvailableDates.mockReturnValue(mockDates)

        const result = await adapter.getHealthStatus()

        expect(result).toEqual({
          isHealthy: true,
          lastCollection: '2022-01-01T00:00:00Z',
          recordCount: 3,
          oldestRecord: '2022-01-01',
          newestRecord: '2022-01-03'
        })
      })

      it('should return unhealthy status when no data exists for SQLite', async () => {
        mockDatabase.getLatestMetrics.mockReturnValue(null)
        mockDatabase.getAvailableDates.mockReturnValue([])

        const result = await adapter.getHealthStatus()

        expect(result).toEqual({
          isHealthy: false,
          lastCollection: null,
          recordCount: 0,
          oldestRecord: null,
          newestRecord: null
        })
      })

      it('should handle SQLite health check errors gracefully', async () => {
        mockDatabase.getLatestMetrics.mockImplementation(() => {
          throw new Error('Database error')
        })

        const result = await adapter.getHealthStatus()

        expect(result).toEqual({
          isHealthy: false,
          lastCollection: null,
          recordCount: 0,
          oldestRecord: null,
          newestRecord: null
        })
      })

      it('should use current timestamp when created_at is missing for SQLite', async () => {
        const mockLatest = {
          id: 1,
          timestamp: Date.now(),
          date: '2022-01-01'
          // No created_at field
        }
        const mockDates = ['2022-01-01']

        mockDatabase.getLatestMetrics.mockReturnValue(mockLatest)
        mockDatabase.getAvailableDates.mockReturnValue(mockDates)

        const result = await adapter.getHealthStatus()

        expect(result.isHealthy).toBe(true)
        expect(result.lastCollection).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/) // ISO string format
      })
    })

    describe('close', () => {
      it('should call sync close for SQLite', async () => {
        mockDatabase.close.mockReturnValue(undefined)

        await adapter.close()

        expect(mockDatabase.close).toHaveBeenCalled()
      })
    })
  })

  describe('database type detection', () => {
    it('should handle database type switching', async () => {
      // Start with PostgreSQL
      mockGetDatabaseType.mockReturnValue('postgresql')
      mockDatabase.storeMetrics.mockResolvedValue(undefined)

      await adapter.storeMetrics({ timestamp: Date.now(), date: '2022-01-01' } as any)

      expect(mockDatabase.storeMetrics).toHaveBeenCalled()

      // Switch to SQLite
      mockGetDatabaseType.mockReturnValue('sqlite')
      mockDatabase.storeMetrics.mockReturnValue(undefined)

      await adapter.storeMetrics({ timestamp: Date.now(), date: '2022-01-02' } as any)

      expect(mockDatabase.storeMetrics).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    it('should propagate PostgreSQL errors', async () => {
      mockGetDatabaseType.mockReturnValue('postgresql')
      mockDatabase.getLatestMetrics.mockRejectedValue(new Error('PostgreSQL connection failed'))

      await expect(adapter.getLatestMetrics()).rejects.toThrow('PostgreSQL connection failed')
    })

    it('should propagate SQLite errors', async () => {
      mockGetDatabaseType.mockReturnValue('sqlite')
      mockDatabase.getLatestMetrics.mockImplementation(() => {
        throw new Error('SQLite database locked')
      })

      await expect(adapter.getLatestMetrics()).rejects.toThrow('SQLite database locked')
    })
  })
})