/**
 * Database adapter that provides a unified interface for both SQLite and Neon databases
 * Handles the sync/async differences transparently
 */

import { RepositoryMetricsRecord } from './database'
import { getDatabase, getDatabaseType } from '../config/database'

class DatabaseAdapter {
  private static instance: DatabaseAdapter
  private db: any

  private constructor() {
    this.db = getDatabase()
  }

  static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter()
    }
    return DatabaseAdapter.instance
  }

  async storeMetrics(metrics: Omit<RepositoryMetricsRecord, 'id' | 'created_at'>): Promise<void> {
    const dbType = getDatabaseType()
    
    if (dbType === 'postgresql') {
      await this.db.storeMetrics(metrics)
    } else {
      this.db.storeMetrics(metrics)
    }
  }

  async getLatestMetrics(): Promise<RepositoryMetricsRecord | null> {
    const dbType = getDatabaseType()
    
    if (dbType === 'postgresql') {
      return await this.db.getLatestMetrics()
    } else {
      return this.db.getLatestMetrics()
    }
  }

  async getMetricsInRange(startDate: string, endDate: string): Promise<RepositoryMetricsRecord[]> {
    const dbType = getDatabaseType()
    
    if (dbType === 'postgresql') {
      return await this.db.getMetricsInRange(startDate, endDate)
    } else {
      return this.db.getMetricsInRange(startDate, endDate)
    }
  }

  async getTimeRangeMetrics(days: number): Promise<any | null> {
    const dbType = getDatabaseType()
    
    if (dbType === 'postgresql') {
      return await this.db.getTimeRangeMetrics(days)
    } else {
      return this.db.getTimeRangeMetrics(days)
    }
  }

  async getAvailableDates(): Promise<string[]> {
    const dbType = getDatabaseType()
    
    if (dbType === 'postgresql') {
      return await this.db.getAvailableDates()
    } else {
      return this.db.getAvailableDates()
    }
  }

  async getMetricsForTrends(days: number): Promise<RepositoryMetricsRecord[]> {
    const dbType = getDatabaseType()
    
    if (dbType === 'postgresql') {
      return await this.db.getMetricsForTrends(days)
    } else {
      // SQLite doesn't have this method, so we'll use getMetricsInRange
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      return this.db.getMetricsInRange(startDate, endDate)
    }
  }

  async cleanupOldMetrics(): Promise<void> {
    const dbType = getDatabaseType()
    
    if (dbType === 'postgresql') {
      await this.db.cleanupOldMetrics()
    } else {
      this.db.cleanupOldMetrics()
    }
  }

  async getHealthStatus(): Promise<{
    isHealthy: boolean
    lastCollection: string | null
    recordCount: number
    oldestRecord: string | null
    newestRecord: string | null
  }> {
    const dbType = getDatabaseType()
    
    if (dbType === 'postgresql') {
      return await this.db.getHealthStatus()
    } else {
      // For SQLite, we need to implement this manually
      try {
        const latest = this.db.getLatestMetrics()
        const availableDates = this.db.getAvailableDates()
        
        if (!latest || availableDates.length === 0) {
          return {
            isHealthy: false,
            lastCollection: null,
            recordCount: 0,
            oldestRecord: null,
            newestRecord: null
          }
        }

        return {
          isHealthy: true,
          lastCollection: latest.created_at || new Date().toISOString(),
          recordCount: availableDates.length,
          oldestRecord: availableDates[0],
          newestRecord: availableDates[availableDates.length - 1]
        }
      } catch (error) {
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

  async close(): Promise<void> {
    const dbType = getDatabaseType()
    
    if (dbType === 'postgresql') {
      await this.db.close()
    } else {
      this.db.close()
    }
  }
}

const databaseAdapter = DatabaseAdapter.getInstance()

export { DatabaseAdapter }
export default databaseAdapter