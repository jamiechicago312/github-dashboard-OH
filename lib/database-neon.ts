import { sql } from '@vercel/postgres'

export interface RepositoryMetricsRecord {
  id?: number
  timestamp: number
  date: string
  stars: number
  forks: number
  contributors: number
  open_issues: number
  closed_issues: number
  open_prs: number
  closed_prs: number
  merged_prs: number
  commits: number
  releases: number
  created_at?: string
}

class NeonDatabase {
  private static instance: NeonDatabase

  static getInstance(): NeonDatabase {
    if (!NeonDatabase.instance) {
      NeonDatabase.instance = new NeonDatabase()
    }
    return NeonDatabase.instance
  }

  async initialize(): Promise<void> {
    try {
      // Create the repository_metrics table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS repository_metrics (
          id SERIAL PRIMARY KEY,
          timestamp BIGINT NOT NULL,
          date DATE NOT NULL,
          stars INTEGER NOT NULL DEFAULT 0,
          forks INTEGER NOT NULL DEFAULT 0,
          contributors INTEGER NOT NULL DEFAULT 0,
          open_issues INTEGER NOT NULL DEFAULT 0,
          closed_issues INTEGER NOT NULL DEFAULT 0,
          open_prs INTEGER NOT NULL DEFAULT 0,
          closed_prs INTEGER NOT NULL DEFAULT 0,
          merged_prs INTEGER NOT NULL DEFAULT 0,
          commits INTEGER NOT NULL DEFAULT 0,
          releases INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Create indexes for better query performance
      await sql`
        CREATE INDEX IF NOT EXISTS idx_repository_metrics_date 
        ON repository_metrics(date)
      `
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_repository_metrics_timestamp 
        ON repository_metrics(timestamp)
      `

      console.log('✅ Neon database initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Neon database:', error)
      throw error
    }
  }

  async storeMetrics(metrics: Omit<RepositoryMetricsRecord, 'id' | 'created_at'>): Promise<void> {
    try {
      await this.initialize() // Ensure table exists

      await sql`
        INSERT INTO repository_metrics (
          timestamp, date, stars, forks, contributors,
          open_issues, closed_issues, open_prs, closed_prs, merged_prs,
          commits, releases
        ) VALUES (
          ${metrics.timestamp}, ${metrics.date}, ${metrics.stars}, ${metrics.forks}, ${metrics.contributors},
          ${metrics.open_issues}, ${metrics.closed_issues}, ${metrics.open_prs}, ${metrics.closed_prs}, ${metrics.merged_prs},
          ${metrics.commits}, ${metrics.releases}
        )
      `

      console.log(`✅ Metrics stored in Neon database for ${metrics.date}`)
    } catch (error) {
      console.error('❌ Failed to store metrics in Neon database:', error)
      throw error
    }
  }

  async getLatestMetrics(): Promise<RepositoryMetricsRecord | null> {
    try {
      await this.initialize()

      const result = await sql`
        SELECT * FROM repository_metrics 
        ORDER BY timestamp DESC 
        LIMIT 1
      `

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0] as any
      return {
        id: row.id,
        timestamp: parseInt(row.timestamp),
        date: row.date,
        stars: row.stars,
        forks: row.forks,
        contributors: row.contributors,
        open_issues: row.open_issues,
        closed_issues: row.closed_issues,
        open_prs: row.open_prs,
        closed_prs: row.closed_prs,
        merged_prs: row.merged_prs,
        commits: row.commits,
        releases: row.releases,
        created_at: row.created_at
      }
    } catch (error) {
      console.error('❌ Failed to get latest metrics from Neon database:', error)
      throw error
    }
  }

  async getMetricsInRange(startDate: string, endDate: string): Promise<RepositoryMetricsRecord[]> {
    try {
      await this.initialize()

      const result = await sql`
        SELECT * FROM repository_metrics 
        WHERE date >= ${startDate} AND date <= ${endDate}
        ORDER BY date ASC
      `

      return result.rows.map((row: any) => ({
        id: row.id,
        timestamp: parseInt(row.timestamp),
        date: row.date,
        stars: row.stars,
        forks: row.forks,
        contributors: row.contributors,
        open_issues: row.open_issues,
        closed_issues: row.closed_issues,
        open_prs: row.open_prs,
        closed_prs: row.closed_prs,
        merged_prs: row.merged_prs,
        commits: row.commits,
        releases: row.releases,
        created_at: row.created_at
      }))
    } catch (error) {
      console.error('❌ Failed to get metrics in range from Neon database:', error)
      throw error
    }
  }

  async getMetricsForTrends(days: number): Promise<RepositoryMetricsRecord[]> {
    try {
      await this.initialize()

      const result = await sql`
        SELECT * FROM repository_metrics 
        WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY date ASC
      `

      return result.rows.map((row: any) => ({
        id: row.id,
        timestamp: parseInt(row.timestamp),
        date: row.date,
        stars: row.stars,
        forks: row.forks,
        contributors: row.contributors,
        open_issues: row.open_issues,
        closed_issues: row.closed_issues,
        open_prs: row.open_prs,
        closed_prs: row.closed_prs,
        merged_prs: row.merged_prs,
        commits: row.commits,
        releases: row.releases,
        created_at: row.created_at
      }))
    } catch (error) {
      console.error('❌ Failed to get trends metrics from Neon database:', error)
      throw error
    }
  }

  // Alias for compatibility with SQLite interface
  async getMetricsByDateRange(startDate: string, endDate: string): Promise<RepositoryMetricsRecord[]> {
    return this.getMetricsInRange(startDate, endDate)
  }

  async getTimeRangeMetrics(days: number): Promise<any | null> {
    try {
      await this.initialize()

      const now = new Date()
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))

      // Get current metrics (within the time range)
      const currentResult = await sql`
        SELECT * FROM repository_metrics 
        WHERE timestamp >= ${startDate.getTime()}
        ORDER BY timestamp DESC 
        LIMIT 1
      `

      // Get previous metrics (before the time range)
      const previousResult = await sql`
        SELECT * FROM repository_metrics 
        WHERE timestamp < ${startDate.getTime()}
        ORDER BY timestamp DESC 
        LIMIT 1
      `

      const current = currentResult.rows.length > 0 ? currentResult.rows[0] as any : null
      const previous = previousResult.rows.length > 0 ? previousResult.rows[0] as any : null

      if (!current) return null

      return {
        current: {
          stars: current.stars,
          forks: current.forks,
          contributors: current.contributors
        },
        previous: previous ? {
          stars: previous.stars,
          forks: previous.forks,
          contributors: previous.contributors
        } : {
          stars: current.stars,
          forks: current.forks,
          contributors: current.contributors
        },
        change: {
          stars: current.stars - (previous?.stars || current.stars),
          forks: current.forks - (previous?.forks || current.forks),
          contributors: current.contributors - (previous?.contributors || current.contributors)
        }
      }
    } catch (error) {
      console.error('❌ Failed to get time range metrics from Neon database:', error)
      throw error
    }
  }

  async getAvailableDates(): Promise<string[]> {
    try {
      await this.initialize()

      const result = await sql`
        SELECT DISTINCT date 
        FROM repository_metrics 
        ORDER BY date ASC
      `

      return result.rows.map((row: any) => row.date)
    } catch (error) {
      console.error('❌ Failed to get available dates from Neon database:', error)
      throw error
    }
  }

  async cleanupOldMetrics(): Promise<void> {
    try {
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

      await this.cleanupOldData(365 * 2) // 2 years
      console.log('🧹 Cleaned up old metrics (older than 2 years)')
    } catch (error) {
      console.error('❌ Failed to cleanup old metrics from Neon database:', error)
      throw error
    }
  }

  async close(): Promise<void> {
    // Neon doesn't require explicit connection closing
    console.log('🔌 Neon database connection closed (no-op)')
  }

  async cleanupOldData(retentionDays: number): Promise<number> {
    try {
      await this.initialize()

      const result = await sql`
        DELETE FROM repository_metrics 
        WHERE date < CURRENT_DATE - INTERVAL '${retentionDays} days'
      `

      const deletedCount = result.rowCount || 0
      console.log(`🧹 Cleaned up ${deletedCount} old records from Neon database`)
      return deletedCount
    } catch (error) {
      console.error('❌ Failed to cleanup old data from Neon database:', error)
      throw error
    }
  }

  async getHealthStatus(): Promise<{
    isHealthy: boolean
    lastCollection: string | null
    recordCount: number
    oldestRecord: string | null
    newestRecord: string | null
  }> {
    try {
      await this.initialize()

      const countResult = await sql`SELECT COUNT(*) as count FROM repository_metrics`
      const recordCount = parseInt(countResult.rows[0].count as string)

      if (recordCount === 0) {
        return {
          isHealthy: false,
          lastCollection: null,
          recordCount: 0,
          oldestRecord: null,
          newestRecord: null
        }
      }

      const rangeResult = await sql`
        SELECT 
          MIN(date) as oldest_date,
          MAX(date) as newest_date,
          MAX(created_at) as last_collection
        FROM repository_metrics
      `

      const row = rangeResult.rows[0] as any

      return {
        isHealthy: true,
        lastCollection: row.last_collection,
        recordCount,
        oldestRecord: row.oldest_date,
        newestRecord: row.newest_date
      }
    } catch (error) {
      console.error('❌ Failed to get health status from Neon database:', error)
      return {
        isHealthy: false,
        lastCollection: null,
        recordCount: 0,
        oldestRecord: null,
        newestRecord: null
      }
    }
  }
}

export default NeonDatabase.getInstance()