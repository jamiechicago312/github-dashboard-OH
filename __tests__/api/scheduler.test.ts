import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/scheduler/route'
import DataCollectionScheduler from '@/lib/scheduler'
import MetricsCollector from '@/lib/metrics-collector'

// Mock dependencies
jest.mock('@/lib/scheduler')
jest.mock('@/lib/metrics-collector')

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Headers(),
    })),
  },
}))

const mockScheduler = DataCollectionScheduler as jest.Mocked<typeof DataCollectionScheduler>
const mockMetricsCollector = MetricsCollector as jest.Mocked<typeof MetricsCollector>

// Mock NextRequest to avoid constructor issues
const mockNextRequest = {
  method: 'GET',
  url: 'http://localhost/api/scheduler',
  headers: new Headers(),
  json: jest.fn(),
  text: jest.fn(),
} as unknown as NextRequest

// Helper function to create NextRequest
function createRequest(method: string = 'GET'): NextRequest {
  return { ...mockNextRequest, method } as NextRequest
}

// Mock console methods
const originalConsole = console
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsole.error
})

describe('/api/scheduler', () => {
  let mockSchedulerInstance: any
  let mockCollectorInstance: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock instances
    mockSchedulerInstance = {
      getStats: jest.fn(),
      getConfig: jest.fn(),
      isHealthy: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      collectNow: jest.fn(),
      updateConfig: jest.fn()
    }

    mockCollectorInstance = {
      getHealthStatus: jest.fn()
    }

    // Mock getInstance methods
    mockScheduler.getInstance = jest.fn().mockReturnValue(mockSchedulerInstance)
    Object.assign(mockMetricsCollector, mockCollectorInstance)
  })

  describe('GET /api/scheduler', () => {
    it('should return scheduler status and statistics', async () => {
      const mockStats = {
        isRunning: true,
        totalCollections: 10,
        totalErrors: 1,
        consecutiveErrors: 0,
        lastSuccessfulCollection: new Date(),
        lastFailedCollection: null
      }

      const mockConfig = {
        metricsInterval: '0 */6 * * *',
        cleanupInterval: '0 2 * * 0',
        retentionDays: 365,
        maxRetries: 3,
        retryDelay: 5000,
        backoffMultiplier: 2,
        enableErrorNotifications: true,
        errorThreshold: 5
      }

      const mockHealth = {
        isHealthy: true,
        lastCollection: new Date(),
        errorCount: 0,
        message: 'Last collected 2 hours ago'
      }

      mockSchedulerInstance.getStats.mockReturnValue(mockStats)
      mockSchedulerInstance.getConfig.mockReturnValue(mockConfig)
      mockSchedulerInstance.isHealthy.mockReturnValue(true)
      mockCollectorInstance.getHealthStatus.mockReturnValue(mockHealth)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: {
          scheduler: {
            isRunning: true,
            isHealthy: true,
            stats: mockStats,
            config: mockConfig
          },
          collector: {
            health: mockHealth
          }
        }
      })

      expect(mockSchedulerInstance.getStats).toHaveBeenCalled()
      expect(mockSchedulerInstance.getConfig).toHaveBeenCalled()
      expect(mockSchedulerInstance.isHealthy).toHaveBeenCalled()
      expect(mockCollectorInstance.getHealthStatus).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      mockSchedulerInstance.getStats.mockImplementation(() => {
        throw new Error('Scheduler error')
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to get scheduler status'
      })

      expect(console.error).toHaveBeenCalledWith('Error getting scheduler status:', expect.any(Error))
    })
  })

  describe('POST /api/scheduler', () => {
    describe('start action', () => {
      it('should start the scheduler', async () => {
        const request = new NextRequest('http://localhost/api/scheduler', {
          body: JSON.stringify({ action: 'start' })
        })

        mockSchedulerInstance.start.mockReturnValue(undefined)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
          success: true,
          message: 'Scheduler started successfully'
        })

        expect(mockSchedulerInstance.start).toHaveBeenCalled()
      })
    })

    describe('stop action', () => {
      it('should stop the scheduler', async () => {
        const request = new NextRequest('http://localhost/api/scheduler', {
          body: JSON.stringify({ action: 'stop' })
        })

        mockSchedulerInstance.stop.mockReturnValue(undefined)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
          success: true,
          message: 'Scheduler stopped successfully'
        })

        expect(mockSchedulerInstance.stop).toHaveBeenCalled()
      })
    })

    describe('collect action', () => {
      it('should trigger manual collection', async () => {
        const request = new NextRequest('http://localhost/api/scheduler', {
          body: JSON.stringify({ action: 'collect' })
        })

        mockSchedulerInstance.collectNow.mockResolvedValue(undefined)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
          success: true,
          message: 'Manual collection completed successfully'
        })

        expect(mockSchedulerInstance.collectNow).toHaveBeenCalled()
      })

      it('should handle collection errors', async () => {
        const request = new NextRequest('http://localhost/api/scheduler', {
          body: JSON.stringify({ action: 'collect' })
        })

        mockSchedulerInstance.collectNow.mockRejectedValue(new Error('Collection failed'))

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data).toEqual({
          success: false,
          error: 'Failed to control scheduler'
        })
      })
    })

    describe('configure action', () => {
      it('should update scheduler configuration', async () => {
        const newConfig = {
          maxRetries: 5,
          retryDelay: 10000
        }

        const request = new NextRequest('http://localhost/api/scheduler', {
          body: JSON.stringify({ 
            action: 'configure',
            config: newConfig
          })
        })

        mockSchedulerInstance.updateConfig.mockReturnValue(undefined)

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
          success: true,
          message: 'Scheduler configuration updated successfully'
        })

        expect(mockSchedulerInstance.updateConfig).toHaveBeenCalledWith(newConfig)
      })

      it('should require configuration data', async () => {
        const request = new NextRequest('http://localhost/api/scheduler', {
          body: JSON.stringify({ action: 'configure' })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data).toEqual({
          success: false,
          error: 'Configuration data required'
        })

        expect(mockSchedulerInstance.updateConfig).not.toHaveBeenCalled()
      })
    })

    describe('invalid action', () => {
      it('should reject invalid actions', async () => {
        const request = new NextRequest('http://localhost/api/scheduler', {
          body: JSON.stringify({ action: 'invalid' })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data).toEqual({
          success: false,
          error: 'Invalid action. Use: start, stop, collect, or configure'
        })
      })
    })

    describe('error handling', () => {
      it('should handle JSON parsing errors', async () => {
        const request = new NextRequest('http://localhost/api/scheduler', {
          body: 'invalid json'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data).toEqual({
          success: false,
          error: 'Failed to control scheduler'
        })
      })

      it('should handle scheduler operation errors', async () => {
        const request = new NextRequest('http://localhost/api/scheduler', {
          body: JSON.stringify({ action: 'start' })
        })

        mockSchedulerInstance.start.mockImplementation(() => {
          throw new Error('Scheduler start failed')
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data).toEqual({
          success: false,
          error: 'Failed to control scheduler'
        })

        expect(console.error).toHaveBeenCalledWith('Error controlling scheduler:', expect.any(Error))
      })
    })
  })
})