import { GitHubAPI } from './github-api'
import { RepositoryMetricsRecord } from './database'
import { GitHubRepository, GitHubContributor, GitHubIssue, GitHubPullRequest, GitHubRelease } from '@/types/github'
import DatabaseAdapter, { DatabaseAdapter as DatabaseAdapterType } from './database-adapter'

const OWNER = process.env.GITHUB_OWNER || 'All-Hands-AI'
const REPO = process.env.GITHUB_REPO || 'OpenHands'

export class MetricsCollector {
  private static instance: MetricsCollector
  private db: DatabaseAdapterType

  private constructor() {
    this.db = DatabaseAdapter
    console.log(`📊 MetricsCollector initialized with database adapter`)
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  /**
   * Collect current metrics and store them in the database
   * This method collects ALL-TIME statistics as of the current snapshot date
   */
  async collectCurrentMetrics(): Promise<RepositoryMetricsRecord> {
    console.log('🔄 Collecting all-time repository metrics for daily snapshot...')
    
    try {
      // Use the new all-time statistics method to get accurate totals
      const allTimeStats = await GitHubAPI.getAllTimeRepositoryStats(OWNER, REPO)

      const now = new Date()
      const metrics: Omit<RepositoryMetricsRecord, 'id' | 'created_at'> = {
        timestamp: now.getTime(),
        date: now.toISOString().split('T')[0], // YYYY-MM-DD format
        // All-time cumulative statistics
        stars: allTimeStats.stars,
        forks: allTimeStats.forks,
        contributors: allTimeStats.contributors,
        commits: allTimeStats.commits,
        releases: allTimeStats.releases,
        // All-time issue statistics
        open_issues: allTimeStats.issues.open,
        closed_issues: allTimeStats.issues.closed,
        // All-time pull request statistics
        open_prs: allTimeStats.pullRequests.open,
        closed_prs: allTimeStats.pullRequests.closed,
        merged_prs: allTimeStats.pullRequests.merged
      }

      // Validate the metrics before storing
      if (!this.validateMetrics(metrics)) {
        throw new Error('Invalid metrics data collected')
      }

      // Store in database
      await this.db.storeMetrics(metrics)
      
      console.log('✅ All-time metrics collected and stored successfully:', {
        date: metrics.date,
        stars: metrics.stars,
        forks: metrics.forks,
        contributors: metrics.contributors,
        commits: metrics.commits,
        releases: metrics.releases,
        issues: `${metrics.open_issues} open, ${metrics.closed_issues} closed (${metrics.open_issues + metrics.closed_issues} total)`,
        prs: `${metrics.open_prs} open, ${metrics.closed_prs} closed, ${metrics.merged_prs} merged (${metrics.open_prs + metrics.closed_prs} total)`
      })

      return { ...metrics, id: Date.now() } as RepositoryMetricsRecord
    } catch (error) {
      console.error('❌ Error collecting all-time metrics:', error)
      throw error
    }
  }

  /**
   * Check if metrics have been collected today
   */
  async hasCollectedToday(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    const latest = await this.db.getLatestMetrics()
    return latest?.date === today
  }

  /**
   * Collect metrics if not already collected today
   */
  async collectIfNeeded(): Promise<RepositoryMetricsRecord | null> {
    if (await this.hasCollectedToday()) {
      console.log('📊 Metrics already collected today, skipping...')
      return await this.db.getLatestMetrics()
    }

    return await this.collectCurrentMetrics()
  }

  /**
   * Get the latest metrics record
   */
  async getLatestMetrics(): Promise<RepositoryMetricsRecord | null> {
    return await this.db.getLatestMetrics()
  }

  /**
   * Get historical trend data for the dashboard
   */
  async getHistoricalTrends(days: number = 30) {
    return await this.db.getTimeRangeMetrics(days)
  }

  /**
   * Clean up old metrics data (keep last N days)
   */
  async cleanupOldMetrics(retentionDays: number = 365): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

    console.log(`🧹 Cleaning up metrics older than ${cutoffDateStr}...`)
    await this.db.cleanupOldMetrics()
  }

  /**
   * Collect and store metrics (used by scheduler)
   */
  async collectAndStore(): Promise<RepositoryMetricsRecord> {
    return await this.collectCurrentMetrics()
  }

  /**
   * Validate collected metrics data
   */
  private validateMetrics(metrics: Partial<RepositoryMetricsRecord>): boolean {
    const required = ['stars', 'forks', 'contributors', 'commits', 'releases', 'open_issues', 'closed_issues', 'open_prs', 'closed_prs', 'merged_prs']
    
    for (const field of required) {
      const value = metrics[field as keyof RepositoryMetricsRecord]
      if (typeof value !== 'number' || isNaN(value)) {
        console.error(`❌ Invalid metrics: ${field} is not a valid number (got: ${value})`)
        return false
      }
    }

    // Basic sanity checks for non-negative values
    const nonNegativeFields = ['stars', 'forks', 'contributors', 'commits', 'releases', 'open_issues', 'closed_issues', 'open_prs', 'closed_prs', 'merged_prs']
    for (const field of nonNegativeFields) {
      const value = metrics[field as keyof RepositoryMetricsRecord] as number
      if (value < 0) {
        console.error(`❌ Invalid metrics: ${field} cannot be negative (got: ${value})`)
        return false
      }
    }

    // Logical consistency checks
    if (metrics.merged_prs! > metrics.closed_prs!) {
      console.error(`❌ Invalid metrics: merged PRs (${metrics.merged_prs}) cannot exceed closed PRs (${metrics.closed_prs})`)
      return false
    }

    console.log('✅ Metrics validation passed')
    return true
  }

  /**
   * Get collection health status
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean
    lastCollection: Date | null
    errorCount: number
    message: string
  }> {
    const latest = await this.getLatestMetrics()
    const now = new Date()
    
    if (!latest) {
      return {
        isHealthy: false,
        lastCollection: null,
        errorCount: 0,
        message: 'No metrics collected yet'
      }
    }

    const lastCollectionDate = new Date(latest.timestamp)
    const hoursSinceLastCollection = (now.getTime() - lastCollectionDate.getTime()) / (1000 * 60 * 60)
    
    const isHealthy = hoursSinceLastCollection < 24 // Consider healthy if collected within 24 hours
    
    return {
      isHealthy,
      lastCollection: lastCollectionDate,
      errorCount: 0, // TODO: Track error count in database
      message: isHealthy 
        ? `Last collected ${Math.round(hoursSinceLastCollection)} hours ago`
        : `Last collection was ${Math.round(hoursSinceLastCollection)} hours ago (stale)`
    }
  }
}

export default MetricsCollector.getInstance()