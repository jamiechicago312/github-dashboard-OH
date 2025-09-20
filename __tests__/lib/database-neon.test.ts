import NeonDatabase, { RepositoryMetricsRecord } from '@/lib/database-neon'
import { sql } from '@vercel/postgres'

// Mock the @vercel/postgres module
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}))

const mockSql = sql as jest.MockedFunction<typeof sql>

describe('NeonDatabase', () => {
  let db: typeof NeonDatabase

  beforeEach(() => {
    jest.clearAllMocks()
    db = NeonDatabase
  })

  describe('initialize', () => {
    it('should create tables and indexes successfully', async () => {
      mockSql.mockResolvedValue({ rows: [], rowCount: 0 } as any)

      await db.initialize()

      expect(mockSql).toHaveBeenCalledTimes(3) // CREATE TABLE + 2 CREATE INDEX
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('CREATE TABLE IF NOT EXISTS repository_metrics')])
      )
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_repository_metrics_date')])
      )
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_repository_metrics_timestamp')])
      )
    })

    it('should handle initialization errors', async () => {
      const error = new Error('Database connection failed')
      mockSql.mockRejectedValue(error)

      await expect(db.initialize()).rejects.toThrow('Database connection failed')
    })
  })

  describe('storeMetrics', () => {
    const mockMetrics: Omit<RepositoryMetricsRecord, 'id' | 'created_at'> = {
      timestamp: 1640995200000,
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

    it('should store metrics successfully', async () => {
      mockSql.mockResolvedValue({ rows: [], rowCount: 1 } as any)

      await db.storeMetrics(mockMetrics)

      expect(mockSql).toHaveBeenCalledTimes(2) // initialize + insert
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('INSERT INTO repository_metrics'),
          mockMetrics.timestamp,
          mockMetrics.date,
          mockMetrics.stars,
          mockMetrics.forks,
          mockMetrics.contributors,
          mockMetrics.open_issues,
          mockMetrics.closed_issues,
          mockMetrics.open_prs,
          mockMetrics.closed_prs,
          mockMetrics.merged_prs,
          mockMetrics.commits,
          mockMetrics.releases
        ])
      )
    })

    it('should handle storage errors', async () => {
      mockSql.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
      mockSql.mockRejectedValueOnce(new Error('Insert failed'))

      await expect(db.storeMetrics(mockMetrics)).rejects.toThrow('Insert failed')
    })
  })

  describe('getLatestMetrics', () => {
    it('should return latest metrics when data exists', async () => {
      const mockRow = {
        id: 1,
        timestamp: '1640995200000',
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
        releases: 10,
        created_at: '2022-01-01T00:00:00Z'
      }

      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 } as any) // select

      const result = await db.getLatestMetrics()

      expect(result).toEqual({
        id: 1,
        timestamp: 1640995200000,
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
        releases: 10,
        created_at: '2022-01-01T00:00:00Z'
      })

      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('SELECT * FROM repository_metrics')])
      )
    })

    it('should return null when no data exists', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // select

      const result = await db.getLatestMetrics()

      expect(result).toBeNull()
    })

    it('should handle query errors', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockRejectedValueOnce(new Error('Query failed'))

      await expect(db.getLatestMetrics()).rejects.toThrow('Query failed')
    })
  })

  describe('getMetricsInRange', () => {
    it('should return metrics within date range', async () => {
      const mockRows = [
        {
          id: 1,
          timestamp: '1640995200000',
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
          releases: 10,
          created_at: '2022-01-01T00:00:00Z'
        },
        {
          id: 2,
          timestamp: '1641081600000',
          date: '2022-01-02',
          stars: 105,
          forks: 52,
          contributors: 26,
          open_issues: 12,
          closed_issues: 92,
          open_prs: 6,
          closed_prs: 47,
          merged_prs: 42,
          commits: 1020,
          releases: 10,
          created_at: '2022-01-02T00:00:00Z'
        }
      ]

      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: mockRows, rowCount: 2 } as any) // select

      const result = await db.getMetricsInRange('2022-01-01', '2022-01-02')

      expect(result).toHaveLength(2)
      expect(result[0].timestamp).toBe(1640995200000)
      expect(result[1].timestamp).toBe(1641081600000)

      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('WHERE date >= '),
          '2022-01-01',
          '2022-01-02'
        ])
      )
    })

    it('should return empty array when no data in range', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // select

      const result = await db.getMetricsInRange('2022-01-01', '2022-01-02')

      expect(result).toEqual([])
    })
  })

  describe('getTimeRangeMetrics', () => {
    it('should return current and previous metrics with change calculation', async () => {
      const currentRow = {
        stars: 100,
        forks: 50,
        contributors: 25
      }
      const previousRow = {
        stars: 90,
        forks: 45,
        contributors: 20
      }

      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: [currentRow], rowCount: 1 } as any) // current
        .mockResolvedValueOnce({ rows: [previousRow], rowCount: 1 } as any) // previous

      const result = await db.getTimeRangeMetrics(7)

      expect(result).toEqual({
        current: {
          stars: 100,
          forks: 50,
          contributors: 25
        },
        previous: {
          stars: 90,
          forks: 45,
          contributors: 20
        },
        change: {
          stars: 10,
          forks: 5,
          contributors: 5
        }
      })
    })

    it('should handle case when no previous data exists', async () => {
      const currentRow = {
        stars: 100,
        forks: 50,
        contributors: 25
      }

      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: [currentRow], rowCount: 1 } as any) // current
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // previous

      const result = await db.getTimeRangeMetrics(7)

      expect(result).toEqual({
        current: {
          stars: 100,
          forks: 50,
          contributors: 25
        },
        previous: {
          stars: 100,
          forks: 50,
          contributors: 25
        },
        change: {
          stars: 0,
          forks: 0,
          contributors: 0
        }
      })
    })

    it('should return null when no current data exists', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // current

      const result = await db.getTimeRangeMetrics(7)

      expect(result).toBeNull()
    })
  })

  describe('cleanupOldData', () => {
    it('should delete old records and return count', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rowCount: 5 } as any) // delete

      const result = await db.cleanupOldData(365)

      expect(result).toBe(5)
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('DELETE FROM repository_metrics'),
          365
        ])
      )
    })

    it('should handle cleanup errors', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockRejectedValueOnce(new Error('Delete failed'))

      await expect(db.cleanupOldData(365)).rejects.toThrow('Delete failed')
    })
  })

  describe('getHealthStatus', () => {
    it('should return healthy status with data', async () => {
      const countRow = { count: '100' }
      const rangeRow = {
        oldest_date: '2022-01-01',
        newest_date: '2022-12-31',
        last_collection: '2022-12-31T23:59:59Z'
      }

      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: [countRow], rowCount: 1 } as any) // count
        .mockResolvedValueOnce({ rows: [rangeRow], rowCount: 1 } as any) // range

      const result = await db.getHealthStatus()

      expect(result).toEqual({
        isHealthy: true,
        lastCollection: '2022-12-31T23:59:59Z',
        recordCount: 100,
        oldestRecord: '2022-01-01',
        newestRecord: '2022-12-31'
      })
    })

    it('should return unhealthy status when no data exists', async () => {
      const countRow = { count: '0' }

      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: [countRow], rowCount: 1 } as any) // count

      const result = await db.getHealthStatus()

      expect(result).toEqual({
        isHealthy: false,
        lastCollection: null,
        recordCount: 0,
        oldestRecord: null,
        newestRecord: null
      })
    })

    it('should handle health check errors gracefully', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockRejectedValueOnce(new Error('Health check failed'))

      const result = await db.getHealthStatus()

      expect(result).toEqual({
        isHealthy: false,
        lastCollection: null,
        recordCount: 0,
        oldestRecord: null,
        newestRecord: null
      })
    })
  })

  describe('getAvailableDates', () => {
    it('should return list of available dates', async () => {
      const mockRows = [
        { date: '2022-01-01' },
        { date: '2022-01-02' },
        { date: '2022-01-03' }
      ]

      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: mockRows, rowCount: 3 } as any) // select

      const result = await db.getAvailableDates()

      expect(result).toEqual(['2022-01-01', '2022-01-02', '2022-01-03'])
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('SELECT DISTINCT date')])
      )
    })

    it('should return empty array when no dates available', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // initialize
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // select

      const result = await db.getAvailableDates()

      expect(result).toEqual([])
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NeonDatabase
      const instance2 = NeonDatabase

      expect(instance1).toBe(instance2)
    })
  })
})