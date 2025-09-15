/**
 * Automated Data Collection Scheduler
 * Handles periodic collection of GitHub metrics with error handling and retry logic
 */

import { CronJob } from 'cron'
import MetricsCollector from './metrics-collector'

interface SchedulerConfig {
  // Collection intervals
  metricsInterval: string // Cron expression for metrics collection
  cleanupInterval: string // Cron expression for cleanup
  retentionDays: number   // Days to retain data
  
  // Retry configuration
  maxRetries: number
  retryDelay: number      // Base delay in milliseconds
  backoffMultiplier: number
  
  // Error handling
  enableErrorNotifications: boolean
  errorThreshold: number  // Max consecutive errors before alerting
}

interface SchedulerStats {
  lastSuccessfulCollection: Date | null
  lastFailedCollection: Date | null
  consecutiveErrors: number
  totalCollections: number
  totalErrors: number
  isRunning: boolean
}

class DataCollectionScheduler {
  private static instance: DataCollectionScheduler
  private metricsJob: CronJob | null = null
  private cleanupJob: CronJob | null = null
  private collector: typeof MetricsCollector
  private config: SchedulerConfig
  private stats: SchedulerStats

  private constructor() {
    this.collector = MetricsCollector
    this.config = {
      metricsInterval: '0 */6 * * *',    // Every 6 hours
      cleanupInterval: '0 2 * * 0',      // Weekly at 2 AM Sunday
      retentionDays: 365,                // Keep 1 year of data
      maxRetries: 3,
      retryDelay: 5000,                  // 5 seconds
      backoffMultiplier: 2,
      enableErrorNotifications: true,
      errorThreshold: 5
    }
    this.stats = {
      lastSuccessfulCollection: null,
      lastFailedCollection: null,
      consecutiveErrors: 0,
      totalCollections: 0,
      totalErrors: 0,
      isRunning: false
    }
  }

  static getInstance(): DataCollectionScheduler {
    if (!DataCollectionScheduler.instance) {
      DataCollectionScheduler.instance = new DataCollectionScheduler()
    }
    return DataCollectionScheduler.instance
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('📅 Scheduler configuration updated:', this.config)
  }

  /**
   * Start the automated collection scheduler
   */
  start(): void {
    if (this.stats.isRunning) {
      console.log('⚠️ Scheduler is already running')
      return
    }

    console.log('🚀 Starting automated data collection scheduler...')
    
    // Metrics collection job
    this.metricsJob = new CronJob(
      this.config.metricsInterval,
      () => this.collectMetricsWithRetry(),
      null,
      true,
      'UTC'
    )

    // Cleanup job
    this.cleanupJob = new CronJob(
      this.config.cleanupInterval,
      () => this.performCleanup(),
      null,
      true,
      'UTC'
    )

    this.stats.isRunning = true
    console.log(`✅ Scheduler started:`)
    console.log(`   📊 Metrics collection: ${this.config.metricsInterval}`)
    console.log(`   🧹 Cleanup: ${this.config.cleanupInterval}`)
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.stats.isRunning) {
      console.log('⚠️ Scheduler is not running')
      return
    }

    console.log('🛑 Stopping scheduler...')
    
    if (this.metricsJob) {
      this.metricsJob.stop()
      this.metricsJob = null
    }

    if (this.cleanupJob) {
      this.cleanupJob.stop()
      this.cleanupJob = null
    }

    this.stats.isRunning = false
    console.log('✅ Scheduler stopped')
  }

  /**
   * Collect metrics with retry logic and error handling
   */
  private async collectMetricsWithRetry(): Promise<void> {
    console.log('🔄 Starting scheduled metrics collection...')
    
    let attempt = 0
    let lastError: Error | null = null

    while (attempt < this.config.maxRetries) {
      try {
        await this.collector.collectAndStore()
        
        // Success - reset error counters
        this.stats.lastSuccessfulCollection = new Date()
        this.stats.consecutiveErrors = 0
        this.stats.totalCollections++
        
        console.log(`✅ Metrics collection completed successfully (attempt ${attempt + 1})`)
        return

      } catch (error) {
        attempt++
        lastError = error as Error
        this.stats.totalErrors++
        
        console.error(`❌ Collection attempt ${attempt} failed:`, error)

        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(this.config.backoffMultiplier, attempt - 1)
          console.log(`⏳ Retrying in ${delay}ms...`)
          await this.sleep(delay)
        }
      }
    }

    // All retries failed
    this.stats.lastFailedCollection = new Date()
    this.stats.consecutiveErrors++
    
    console.error(`💥 All ${this.config.maxRetries} collection attempts failed`)
    
    if (this.shouldSendErrorAlert()) {
      await this.sendErrorAlert(lastError!)
    }
  }

  /**
   * Perform database cleanup
   */
  private async performCleanup(): Promise<void> {
    try {
      console.log('🧹 Starting scheduled database cleanup...')
      this.collector.cleanupOldMetrics(this.config.retentionDays)
      console.log(`✅ Cleanup completed - retained last ${this.config.retentionDays} days`)
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
    }
  }

  /**
   * Check if error alert should be sent
   */
  private shouldSendErrorAlert(): boolean {
    return (
      this.config.enableErrorNotifications &&
      this.stats.consecutiveErrors >= this.config.errorThreshold
    )
  }

  /**
   * Send error alert (placeholder for notification system)
   */
  private async sendErrorAlert(error: Error): Promise<void> {
    const alertMessage = {
      timestamp: new Date().toISOString(),
      message: 'GitHub Dashboard: Data collection failing',
      consecutiveErrors: this.stats.consecutiveErrors,
      lastError: error.message,
      stats: this.stats
    }

    console.error('🚨 ERROR ALERT:', alertMessage)
    
    // TODO: Implement actual notification system
    // - Email notifications
    // - Slack/Discord webhooks
    // - System monitoring integration
  }

  /**
   * Manually trigger metrics collection
   */
  async collectNow(): Promise<void> {
    console.log('🔄 Manual metrics collection triggered...')
    await this.collectMetricsWithRetry()
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats {
    return { ...this.stats }
  }

  /**
   * Get current configuration
   */
  getConfig(): SchedulerConfig {
    return { ...this.config }
  }

  /**
   * Check if scheduler is healthy
   */
  isHealthy(): boolean {
    const now = new Date()
    const lastSuccess = this.stats.lastSuccessfulCollection
    
    if (!lastSuccess) return false
    
    // Consider unhealthy if no successful collection in last 24 hours
    const hoursSinceLastSuccess = (now.getTime() - lastSuccess.getTime()) / (1000 * 60 * 60)
    return hoursSinceLastSuccess < 24 && this.stats.consecutiveErrors < this.config.errorThreshold
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export default DataCollectionScheduler