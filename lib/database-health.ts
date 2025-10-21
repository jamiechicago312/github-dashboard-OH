/**
 * Database Health Check and Configuration Validation
 * Provides detailed feedback about database configuration and status
 */

import { getDatabaseConfig, getDatabaseType, isDatabaseConfigured } from '../config/database'
import DatabaseAdapter from './database-adapter'

export interface DatabaseHealthReport {
  isConfigured: boolean
  type: 'sqlite' | 'postgresql'
  isHealthy: boolean
  hasData: boolean
  recordCount: number
  lastCollection: string | null
  issues: string[]
  recommendations: string[]
  configDetails: {
    usingNeon: boolean
    usingFallback: boolean
    connectionString?: string
    host?: string
    database?: string
  }
}

export class DatabaseHealthChecker {
  private static instance: DatabaseHealthChecker

  static getInstance(): DatabaseHealthChecker {
    if (!DatabaseHealthChecker.instance) {
      DatabaseHealthChecker.instance = new DatabaseHealthChecker()
    }
    return DatabaseHealthChecker.instance
  }

  async getHealthReport(): Promise<DatabaseHealthReport> {
    const config = getDatabaseConfig()
    const dbType = getDatabaseType()
    const isConfigured = isDatabaseConfigured()
    const db = DatabaseAdapter

    const report: DatabaseHealthReport = {
      isConfigured,
      type: dbType,
      isHealthy: false,
      hasData: false,
      recordCount: 0,
      lastCollection: null,
      issues: [],
      recommendations: [],
      configDetails: {
        usingNeon: dbType === 'postgresql',
        usingFallback: dbType === 'sqlite'
      }
    }

    // Check configuration details
    if (dbType === 'postgresql') {
      report.configDetails.host = config.host
      report.configDetails.database = config.database
      if (process.env.DATABASE_URL) {
        // Mask sensitive parts of the connection string
        const url = process.env.DATABASE_URL
        const maskedUrl = url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')
        report.configDetails.connectionString = maskedUrl
      }
    }

    // Check database health and data
    try {
      const healthStatus = await db.getHealthStatus()
      report.isHealthy = healthStatus.isHealthy
      report.recordCount = healthStatus.recordCount
      report.lastCollection = healthStatus.lastCollection
      report.hasData = healthStatus.recordCount > 0

      // Analyze issues and provide recommendations
      this.analyzeIssues(report)
    } catch (error) {
      report.issues.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      report.recommendations.push('Check database configuration and connectivity')
    }

    return report
  }

  private analyzeIssues(report: DatabaseHealthReport): void {
    // Issue: Using SQLite fallback when user expects Neon
    if (report.configDetails.usingFallback) {
      report.issues.push('Using SQLite database instead of Neon PostgreSQL')
      report.recommendations.push('Configure Neon database by setting DATABASE_URL environment variable')
      report.recommendations.push('See NEON_INTEGRATION_GUIDE.md for detailed setup instructions')
    }

    // Issue: No data collected
    if (!report.hasData) {
      report.issues.push('No metrics data found in database')
      report.recommendations.push('Run manual data collection: POST /api/scheduler with {"action": "collect"}')
      report.recommendations.push('Start automated scheduler: POST /api/scheduler with {"action": "start"}')
    }

    // Issue: Stale data
    if (report.lastCollection) {
      let lastCollectionDate: Date
      
      // Handle different timestamp formats
      if (typeof report.lastCollection === 'string') {
        lastCollectionDate = new Date(report.lastCollection)
      } else if (typeof report.lastCollection === 'number') {
        // If it's a Unix timestamp in milliseconds or seconds
        lastCollectionDate = new Date(report.lastCollection > 1e10 ? report.lastCollection : report.lastCollection * 1000)
      } else {
        lastCollectionDate = new Date(report.lastCollection)
      }
      
      const hoursSinceLastCollection = (Date.now() - lastCollectionDate.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastCollection > 24) {
        report.issues.push(`Data is stale (last collection: ${Math.round(hoursSinceLastCollection)} hours ago)`)
        report.recommendations.push('Check if automated scheduler is running')
        report.recommendations.push('Verify GitHub API token has proper permissions')
      }
    }

    // Issue: Missing GitHub configuration
    if (!process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      report.issues.push('GitHub repository configuration is incomplete')
      report.recommendations.push('Set GITHUB_OWNER and GITHUB_REPO environment variables')
    }

    // Issue: Missing GitHub token
    if (!process.env.GITHUB_TOKEN) {
      report.issues.push('GitHub API token is not configured')
      report.recommendations.push('Set GITHUB_TOKEN environment variable with a valid GitHub Personal Access Token')
    }
  }

  /**
   * Get a user-friendly summary of the database status
   */
  async getStatusSummary(): Promise<string> {
    const report = await this.getHealthReport()
    
    if (report.configDetails.usingNeon && report.isHealthy && report.hasData) {
      return `✅ Neon database is configured and working properly (${report.recordCount} records)`
    }
    
    if (report.configDetails.usingFallback && report.isHealthy && report.hasData) {
      return `⚠️  Using SQLite fallback database (${report.recordCount} records). Configure Neon for production use.`
    }
    
    if (report.configDetails.usingFallback && !report.hasData) {
      return `❌ No data found. Database is using SQLite fallback and no metrics have been collected.`
    }
    
    if (report.configDetails.usingNeon && !report.isHealthy) {
      return `❌ Neon database is configured but connection failed. Check your DATABASE_URL.`
    }
    
    return `❌ Database issues detected. Check configuration and connectivity.`
  }

  /**
   * Log detailed health report to console
   */
  async logHealthReport(): Promise<void> {
    const report = await this.getHealthReport()
    
    console.log('\n🏥 Database Health Report')
    console.log('========================')
    console.log(`Database Type: ${report.type.toUpperCase()}`)
    console.log(`Status: ${report.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`)
    console.log(`Data Records: ${report.recordCount}`)
    console.log(`Last Collection: ${report.lastCollection || 'Never'}`)
    
    if (report.configDetails.usingNeon) {
      console.log(`Neon Host: ${report.configDetails.host}`)
      console.log(`Database: ${report.configDetails.database}`)
    } else {
      console.log('Using SQLite fallback database')
    }
    
    if (report.issues.length > 0) {
      console.log('\n⚠️  Issues Found:')
      report.issues.forEach(issue => console.log(`   - ${issue}`))
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      report.recommendations.forEach(rec => console.log(`   - ${rec}`))
    }
    
    console.log('========================\n')
  }
}

export default DatabaseHealthChecker.getInstance()