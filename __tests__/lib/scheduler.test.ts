import DataCollectionScheduler from '@/lib/scheduler'
import MetricsCollector from '@/lib/metrics-collector'
import { CronJob } from 'cron'

// Mock dependencies
jest.mock('@/lib/metrics-collector')
jest.mock('cron')

const mockMetricsCollector = MetricsCollector as jest.Mocked<typeof MetricsCollector>
const mockCronJob = CronJob as jest.MockedClass<typeof CronJob>

// Mock console methods to avoid noise in tests
const originalConsole = console
beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalConsole.log
  console.error = originalConsole.error
})

describe('DataCollectionScheduler', () => {
  let scheduler: DataCollectionScheduler

  beforeEach(() => {
    jest.clearAllMocks()
    scheduler = DataCollectionScheduler.getInstance()
    
    // Reset scheduler state
    scheduler.stop()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DataCollectionScheduler.getInstance()
      const instance2 = DataCollectionScheduler.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig = {
        metricsInterval: '0 */12 * * *', // Every 12 hours
        maxRetries: 5,
        retryDelay: 10000
      }

      scheduler.updateConfig(newConfig)
      const config = scheduler.getConfig()

      expect(config.metricsInterval).toBe('0 */12 * * *')
      expect(config.maxRetries).toBe(5)
      expect(config.retryDelay).toBe(10000)
    })

    it('should merge with existing configuration', () => {
      const originalConfig = scheduler.getConfig()
      const newConfig = {
        maxRetries: 5
      }

      scheduler.updateConfig(newConfig)
      const updatedConfig = scheduler.getConfig()

      expect(updatedConfig.maxRetries).toBe(5)
      expect(updatedConfig.metricsInterval).toBe(originalConfig.metricsInterval) // Should remain unchanged
    })
  })

  describe('scheduler lifecycle', () => {
    it('should start scheduler successfully', () => {
      const mockJobInstance = {
        start: jest.fn(),
        stop: jest.fn()
      }
      mockCronJob.mockImplementation(() => mockJobInstance as any)

      scheduler.start()

      expect(mockCronJob).toHaveBeenCalledTimes(2) // metrics + cleanup jobs
      expect(scheduler.getStats().isRunning).toBe(true)
    })

    it('should not start if already running', () => {
      const mockJobInstance = {
        start: jest.fn(),
        stop: jest.fn()
      }
      mockCronJob.mockImplementation(() => mockJobInstance as any)

      scheduler.start()
      scheduler.start() // Try to start again

      expect(mockCronJob).toHaveBeenCalledTimes(2) // Should only be called once
    })

    it('should stop scheduler successfully', () => {
      const mockJobInstance = {
        start: jest.fn(),
        stop: jest.fn()
      }
      mockCronJob.mockImplementation(() => mockJobInstance as any)

      scheduler.start()
      scheduler.stop()

      expect(mockJobInstance.stop).toHaveBeenCalledTimes(2) // Both jobs stopped
      expect(scheduler.getStats().isRunning).toBe(false)
    })

    it('should not stop if not running', () => {
      scheduler.stop() // Try to stop when not running

      expect(scheduler.getStats().isRunning).toBe(false)
    })
  })

  describe('metrics collection with retry logic', () => {
    beforeEach(() => {
      // Mock the private method for testing
      jest.spyOn(scheduler as any, 'collectMetricsWithRetry')
    })

    it('should collect metrics successfully on first attempt', async () => {
      mockMetricsCollector.collectAndStore = jest.fn().mockResolvedValue({
        id: 1,
        timestamp: Date.now(),
        stars: 1000
      })

      await (scheduler as any).collectMetricsWithRetry()

      expect(mockMetricsCollector.collectAndStore).toHaveBeenCalledTimes(1)
      
      const stats = scheduler.getStats()
      expect(stats.totalCollections).toBe(1)
      expect(stats.consecutiveErrors).toBe(0)
      expect(stats.lastSuccessfulCollection).toBeInstanceOf(Date)
    })

    it('should retry on failure and eventually succeed', async () => {
      mockMetricsCollector.collectAndStore = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          id: 1,
          timestamp: Date.now(),
          stars: 1000
        })

      // Mock sleep to avoid actual delays in tests
      jest.spyOn(scheduler as any, 'sleep').mockResolvedValue(undefined)

      await (scheduler as any).collectMetricsWithRetry()

      expect(mockMetricsCollector.collectAndStore).toHaveBeenCalledTimes(2)
      
      const stats = scheduler.getStats()
      expect(stats.totalCollections).toBe(1)
      expect(stats.consecutiveErrors).toBe(0)
      expect(stats.totalErrors).toBe(1)
    })

    it('should fail after max retries', async () => {
      mockMetricsCollector.collectAndStore = jest.fn().mockRejectedValue(new Error('Persistent failure'))
      jest.spyOn(scheduler as any, 'sleep').mockResolvedValue(undefined)
      jest.spyOn(scheduler as any, 'shouldSendErrorAlert').mockReturnValue(false)

      await (scheduler as any).collectMetricsWithRetry()

      const config = scheduler.getConfig()
      expect(mockMetricsCollector.collectAndStore).toHaveBeenCalledTimes(config.maxRetries)
      
      const stats = scheduler.getStats()
      expect(stats.consecutiveErrors).toBe(1)
      expect(stats.totalErrors).toBe(config.maxRetries)
      expect(stats.lastFailedCollection).toBeInstanceOf(Date)
    })

    it('should use exponential backoff for retries', async () => {
      mockMetricsCollector.collectAndStore = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValueOnce({ id: 1, timestamp: Date.now(), stars: 1000 })

      const sleepSpy = jest.spyOn(scheduler as any, 'sleep').mockResolvedValue(undefined)

      await (scheduler as any).collectMetricsWithRetry()

      const config = scheduler.getConfig()
      expect(sleepSpy).toHaveBeenCalledTimes(2)
      expect(sleepSpy).toHaveBeenNthCalledWith(1, config.retryDelay) // First retry: base delay
      expect(sleepSpy).toHaveBeenNthCalledWith(2, config.retryDelay * config.backoffMultiplier) // Second retry: doubled delay
    })
  })

  describe('error handling and alerts', () => {
    it('should send error alert when threshold is reached', async () => {
      scheduler.updateConfig({ errorThreshold: 2, enableErrorNotifications: true })
      
      mockMetricsCollector.collectAndStore = jest.fn().mockRejectedValue(new Error('Persistent failure'))
      jest.spyOn(scheduler as any, 'sleep').mockResolvedValue(undefined)
      jest.spyOn(scheduler as any, 'sendErrorAlert').mockResolvedValue(undefined)

      // First failure - should not send alert
      await (scheduler as any).collectMetricsWithRetry()
      expect((scheduler as any).sendErrorAlert).not.toHaveBeenCalled()

      // Second failure - should send alert
      await (scheduler as any).collectMetricsWithRetry()
      expect((scheduler as any).sendErrorAlert).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should not send alert when notifications are disabled', async () => {
      scheduler.updateConfig({ errorThreshold: 1, enableErrorNotifications: false })
      
      mockMetricsCollector.collectAndStore = jest.fn().mockRejectedValue(new Error('Failure'))
      jest.spyOn(scheduler as any, 'sleep').mockResolvedValue(undefined)
      jest.spyOn(scheduler as any, 'sendErrorAlert').mockResolvedValue(undefined)

      await (scheduler as any).collectMetricsWithRetry()

      expect((scheduler as any).sendErrorAlert).not.toHaveBeenCalled()
    })

    it('should format error alert correctly', async () => {
      const error = new Error('Test error')
      const consoleSpy = jest.spyOn(console, 'error')

      await (scheduler as any).sendErrorAlert(error)

      expect(consoleSpy).toHaveBeenCalledWith('🚨 ERROR ALERT:', expect.objectContaining({
        timestamp: expect.any(String),
        message: 'GitHub Dashboard: Data collection failing',
        lastError: 'Test error',
        stats: expect.any(Object)
      }))
    })
  })

  describe('cleanup operations', () => {
    it('should perform cleanup successfully', async () => {
      mockMetricsCollector.cleanupOldMetrics = jest.fn().mockResolvedValue(undefined)

      await (scheduler as any).performCleanup()

      const config = scheduler.getConfig()
      expect(mockMetricsCollector.cleanupOldMetrics).toHaveBeenCalledWith(config.retentionDays)
    })

    it('should handle cleanup errors gracefully', async () => {
      mockMetricsCollector.cleanupOldMetrics = jest.fn().mockRejectedValue(new Error('Cleanup failed'))
      const consoleSpy = jest.spyOn(console, 'error')

      await (scheduler as any).performCleanup()

      expect(consoleSpy).toHaveBeenCalledWith('❌ Cleanup failed:', expect.any(Error))
    })
  })

  describe('manual collection', () => {
    it('should trigger manual collection', async () => {
      jest.spyOn(scheduler as any, 'collectMetricsWithRetry').mockResolvedValue(undefined)

      await scheduler.collectNow()

      expect((scheduler as any).collectMetricsWithRetry).toHaveBeenCalled()
    })
  })

  describe('health monitoring', () => {
    it('should report healthy when recent collection exists', () => {
      const recentTime = new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      
      // Set up stats with recent successful collection
      const stats = scheduler.getStats()
      stats.lastSuccessfulCollection = recentTime
      stats.consecutiveErrors = 0

      const isHealthy = scheduler.isHealthy()

      expect(isHealthy).toBe(true)
    })

    it('should report unhealthy when no recent collection', () => {
      const staleTime = new Date(Date.now() - 30 * 60 * 60 * 1000) // 30 hours ago
      
      // Set up stats with stale collection
      const stats = scheduler.getStats()
      stats.lastSuccessfulCollection = staleTime
      stats.consecutiveErrors = 0

      const isHealthy = scheduler.isHealthy()

      expect(isHealthy).toBe(false)
    })

    it('should report unhealthy when too many consecutive errors', () => {
      const recentTime = new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      
      // Set up stats with recent collection but many errors
      const stats = scheduler.getStats()
      stats.lastSuccessfulCollection = recentTime
      stats.consecutiveErrors = 10 // Above threshold

      const isHealthy = scheduler.isHealthy()

      expect(isHealthy).toBe(false)
    })

    it('should report unhealthy when no collection has ever occurred', () => {
      const stats = scheduler.getStats()
      stats.lastSuccessfulCollection = null

      const isHealthy = scheduler.isHealthy()

      expect(isHealthy).toBe(false)
    })
  })

  describe('statistics tracking', () => {
    it('should track collection statistics', async () => {
      mockMetricsCollector.collectAndStore = jest.fn().mockResolvedValue({
        id: 1,
        timestamp: Date.now(),
        stars: 1000
      })

      await (scheduler as any).collectMetricsWithRetry()

      const stats = scheduler.getStats()
      expect(stats.totalCollections).toBe(1)
      expect(stats.totalErrors).toBe(0)
      expect(stats.consecutiveErrors).toBe(0)
      expect(stats.lastSuccessfulCollection).toBeInstanceOf(Date)
    })

    it('should track error statistics', async () => {
      mockMetricsCollector.collectAndStore = jest.fn().mockRejectedValue(new Error('Test error'))
      jest.spyOn(scheduler as any, 'sleep').mockResolvedValue(undefined)
      jest.spyOn(scheduler as any, 'shouldSendErrorAlert').mockReturnValue(false)

      await (scheduler as any).collectMetricsWithRetry()

      const stats = scheduler.getStats()
      const config = scheduler.getConfig()
      
      expect(stats.totalCollections).toBe(0)
      expect(stats.totalErrors).toBe(config.maxRetries)
      expect(stats.consecutiveErrors).toBe(1)
      expect(stats.lastFailedCollection).toBeInstanceOf(Date)
    })

    it('should reset consecutive errors on successful collection', async () => {
      // First, simulate a failure
      mockMetricsCollector.collectAndStore = jest.fn().mockRejectedValue(new Error('Test error'))
      jest.spyOn(scheduler as any, 'sleep').mockResolvedValue(undefined)
      jest.spyOn(scheduler as any, 'shouldSendErrorAlert').mockReturnValue(false)

      await (scheduler as any).collectMetricsWithRetry()

      let stats = scheduler.getStats()
      expect(stats.consecutiveErrors).toBe(1)

      // Then simulate a success
      mockMetricsCollector.collectAndStore = jest.fn().mockResolvedValue({
        id: 1,
        timestamp: Date.now(),
        stars: 1000
      })

      await (scheduler as any).collectMetricsWithRetry()

      stats = scheduler.getStats()
      expect(stats.consecutiveErrors).toBe(0)
    })
  })

  describe('cron job configuration', () => {
    it('should create cron jobs with correct intervals', () => {
      const mockJobInstance = {
        start: jest.fn(),
        stop: jest.fn()
      }
      mockCronJob.mockImplementation(() => mockJobInstance as any)

      scheduler.start()

      const config = scheduler.getConfig()
      expect(mockCronJob).toHaveBeenCalledWith(
        config.metricsInterval,
        expect.any(Function),
        null,
        true,
        'UTC'
      )
      expect(mockCronJob).toHaveBeenCalledWith(
        config.cleanupInterval,
        expect.any(Function),
        null,
        true,
        'UTC'
      )
    })

    it('should use UTC timezone for cron jobs', () => {
      const mockJobInstance = {
        start: jest.fn(),
        stop: jest.fn()
      }
      mockCronJob.mockImplementation(() => mockJobInstance as any)

      scheduler.start()

      expect(mockCronJob).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        null,
        true,
        'UTC'
      )
    })
  })

  describe('utility methods', () => {
    it('should implement sleep utility', async () => {
      const start = Date.now()
      await (scheduler as any).sleep(100)
      const end = Date.now()

      expect(end - start).toBeGreaterThanOrEqual(90) // Allow some variance
    })
  })
})