import { GitHubAPI } from './github-api'
import MetricsDatabase, { RepositoryMetricsRecord } from './database'

const OWNER = process.env.GITHUB_OWNER || 'All-Hands-AI'
const REPO = process.env.GITHUB_REPO || 'OpenHands'

export class MetricsCollector {
  private static instance: MetricsCollector
  private db: typeof MetricsDatabase

  private constructor() {
    this.db = MetricsDatabase
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  /**
   * Collect current metrics and store them in the database
   */
  async collectCurrentMetrics(): Promise<RepositoryMetricsRecord> {
    console.log('🔄 Collecting current repository metrics...')
    
    try {
      // Fetch current repository data
      const [repoInfo, contributors, issues, pullRequests, releases] = await Promise.all([
        GitHubAPI.getRepository(OWNER, REPO),
        GitHubAPI.getAllRepositoryContributors(OWNER, REPO),
        GitHubAPI.getRepositoryIssues(OWNER, REPO, 'all', 100),
        GitHubAPI.getRepositoryPullRequests(OWNER, REPO, 'all', 100),
        GitHubAPI.getRepositoryReleases(OWNER, REPO, 10)
      ])

      // Count metrics
      const openIssues = issues.filter(issue => issue.state === 'open').length
      const closedIssues = issues.filter(issue => issue.state === 'closed').length
      const openPRs = pullRequests.filter(pr => pr.state === 'open').length
      const closedPRs = pullRequests.filter(pr => pr.state === 'closed').length
      const mergedPRs = pullRequests.filter(pr => pr.merged_at).length

      // Get commit count (approximate from contributors)
      const totalCommits = contributors.reduce((sum, contributor) => sum + contributor.contributions, 0)

      const now = new Date()
      const metrics: Omit<RepositoryMetricsRecord, 'id' | 'created_at'> = {
        timestamp: now.getTime(),
        date: now.toISOString().split('T')[0], // YYYY-MM-DD format
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        contributors: contributors.length,
        open_issues: openIssues,
        closed_issues: closedIssues,
        open_prs: openPRs,
        closed_prs: closedPRs,
        merged_prs: mergedPRs,
        commits: totalCommits,
        releases: releases.length
      }

      // Store in database
      this.db.storeMetrics(metrics)
      
      console.log('✅ Metrics collected and stored successfully:', {
        date: metrics.date,
        stars: metrics.stars,
        forks: metrics.forks,
        contributors: metrics.contributors,
        issues: `${metrics.open_issues} open, ${metrics.closed_issues} closed`,
        prs: `${metrics.open_prs} open, ${metrics.closed_prs} closed, ${metrics.merged_prs} merged`,
        commits: metrics.commits,
        releases: metrics.releases
      })

      return { ...metrics, id: Date.now() } as RepositoryMetricsRecord
    } catch (error) {
      console.error('❌ Error collecting metrics:', error)
      throw error
    }
  }

  /**
   * Check if metrics have been collected today
   */
  hasCollectedToday(): boolean {
    const today = new Date().toISOString().split('T')[0]
    const latest = this.db.getLatestMetrics()
    return latest?.date === today
  }

  /**
   * Collect metrics if not already collected today
   */
  async collectIfNeeded(): Promise<RepositoryMetricsRecord | null> {
    if (this.hasCollectedToday()) {
      console.log('📊 Metrics already collected today, skipping...')
      return this.db.getLatestMetrics()
    }

    return await this.collectCurrentMetrics()
  }

  /**
   * Get the latest metrics record
   */
  getLatestMetrics(): RepositoryMetricsRecord | null {
    return this.db.getLatestMetrics()
  }

  /**
   * Get historical trend data for the dashboard
   */
  getHistoricalTrends(days: number = 30) {
    return this.db.getTimeRangeMetrics(days)
  }

  /**
   * Clean up old metrics data (keep last N days)
   */
  cleanupOldMetrics(retentionDays: number = 365): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

    console.log(`🧹 Cleaning up metrics older than ${cutoffDateStr}...`)
    this.db.cleanupOldMetrics()
  }
}

export default MetricsCollector.getInstance()