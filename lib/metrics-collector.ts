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
   */
  async collectCurrentMetrics(): Promise<RepositoryMetricsRecord> {
    console.log('🔄 Collecting current repository metrics...')
    
    try {
      // Fetch current repository data with timeout and retry logic
      const [repoInfo, contributors, issues, pullRequests, releases] = await this.fetchWithRetry([
        () => GitHubAPI.getRepository(OWNER, REPO),
        () => GitHubAPI.getAllRepositoryContributors(OWNER, REPO),
        () => GitHubAPI.getRepositoryIssues(OWNER, REPO, 'all', 100),
        () => GitHubAPI.getRepositoryPullRequests(OWNER, REPO, 'all', 100),
        () => GitHubAPI.getRepositoryReleases(OWNER, REPO, 10)
      ])

      // Type the results properly
      const repoData = repoInfo as GitHubRepository
      const contributorsData = contributors as GitHubContributor[]
      const issuesData = issues as GitHubIssue[]
      const pullRequestsData = pullRequests as GitHubPullRequest[]
      const releasesData = releases as GitHubRelease[]

      // Count metrics
      const openIssues = issuesData.filter((issue: GitHubIssue) => issue.state === 'open').length
      const closedIssues = issuesData.filter((issue: GitHubIssue) => issue.state === 'closed').length
      const openPRs = pullRequestsData.filter((pr: GitHubPullRequest) => pr.state === 'open').length
      const closedPRs = pullRequestsData.filter((pr: GitHubPullRequest) => pr.state === 'closed').length
      const mergedPRs = pullRequestsData.filter((pr: GitHubPullRequest) => pr.merged_at).length

      // Get commit count (approximate from contributors)
      const totalCommits = contributorsData.reduce((sum: number, contributor: GitHubContributor) => sum + contributor.contributions, 0)

      const now = new Date()
      const metrics: Omit<RepositoryMetricsRecord, 'id' | 'created_at'> = {
        timestamp: now.getTime(),
        date: now.toISOString().split('T')[0], // YYYY-MM-DD format
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        contributors: contributorsData.length,
        open_issues: openIssues,
        closed_issues: closedIssues,
        open_prs: openPRs,
        closed_prs: closedPRs,
        merged_prs: mergedPRs,
        commits: totalCommits,
        releases: releasesData.length
      }

      // Store in database
      await this.db.storeMetrics(metrics)
      
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
   * Fetch data with retry logic and error handling
   */
  private async fetchWithRetry(
    fetchFunctions: (() => Promise<any>)[],
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<any[]> {
    const results: any[] = []
    
    for (let i = 0; i < fetchFunctions.length; i++) {
      const fetchFn = fetchFunctions[i]
      let attempt = 0
      let lastError: Error | null = null

      while (attempt < maxRetries) {
        try {
          const result = await this.withTimeout(fetchFn(), 30000) // 30 second timeout
          results.push(result)
          break
        } catch (error) {
          attempt++
          lastError = error as Error
          
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
            console.warn(`⚠️ Fetch attempt ${attempt} failed, retrying in ${delay}ms:`, error)
            await this.sleep(delay)
          }
        }
      }

      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch data after ${maxRetries} attempts: ${lastError?.message}`)
      }
    }

    return results
  }

  /**
   * Add timeout to promises
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ])
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Validate collected metrics data
   */
  private validateMetrics(metrics: Partial<RepositoryMetricsRecord>): boolean {
    const required = ['stars', 'forks', 'contributors', 'open_issues', 'closed_issues']
    
    for (const field of required) {
      if (typeof metrics[field as keyof RepositoryMetricsRecord] !== 'number') {
        console.error(`❌ Invalid metrics: ${field} is not a number`)
        return false
      }
    }

    // Basic sanity checks
    if (metrics.stars! < 0 || metrics.forks! < 0 || metrics.contributors! < 0) {
      console.error('❌ Invalid metrics: negative values detected')
      return false
    }

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