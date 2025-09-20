import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/github/collect/route'
import metricsCollector from '@/lib/metrics-collector'

// Mock dependencies
jest.mock('@/lib/metrics-collector')

const mockMetricsCollector = metricsCollector as jest.Mocked<typeof metricsCollector>

// Mock console methods
const originalConsole = console
beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalConsole.log
  console.error = originalConsole.error
})

describe('/api/github/collect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/github/collect', () => {
    it('should collect metrics successfully', async () => {
      const mockMetrics = {
        id: 1,
        timestamp: Date.now(),
        date: '2022-01-01',
        stars: 1000,
        forks: 500,
        contributors: 100,
        open_issues: 25,
        closed_issues: 475,
        open_prs: 10,
        closed_prs: 240,
        merged_prs: 200,
        commits: 5000,
        releases: 50
      }

      mockMetricsCollector.collectCurrentMetrics = jest.fn().mockResolvedValue(mockMetrics)

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Metrics collected successfully',
        data: mockMetrics
      })

      expect(mockMetricsCollector.collectCurrentMetrics).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('📊 Manual metrics collection triggered')
    })

    it('should handle collection errors', async () => {
      const error = new Error('GitHub API rate limit exceeded')
      mockMetricsCollector.collectCurrentMetrics = jest.fn().mockRejectedValue(error)

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to collect metrics',
        details: 'GitHub API rate limit exceeded'
      })

      expect(console.error).toHaveBeenCalledWith('Error collecting metrics:', error)
    })

    it('should handle unknown errors', async () => {
      mockMetricsCollector.collectCurrentMetrics = jest.fn().mockRejectedValue('Unknown error')

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to collect metrics',
        details: 'Unknown error'
      })
    })

    it('should handle non-Error objects', async () => {
      mockMetricsCollector.collectCurrentMetrics = jest.fn().mockRejectedValue({ message: 'Custom error' })

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to collect metrics',
        details: 'Unknown error'
      })
    })
  })

  describe('GET /api/github/collect', () => {
    it('should return status when metrics collected today', async () => {
      const mockMetrics = {
        id: 1,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0], // Today
        stars: 1000
      }

      mockMetricsCollector.hasCollectedToday = jest.fn().mockResolvedValue(true)
      mockMetricsCollector.getLatestMetrics = jest.fn().mockResolvedValue(mockMetrics)

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        hasCollectedToday: true,
        latestMetrics: mockMetrics,
        message: 'Metrics already collected today'
      })

      expect(mockMetricsCollector.hasCollectedToday).toHaveBeenCalled()
      expect(mockMetricsCollector.getLatestMetrics).toHaveBeenCalled()
    })

    it('should return status when no metrics collected today', async () => {
      const mockMetrics = {
        id: 1,
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // Yesterday
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        stars: 1000
      }

      mockMetricsCollector.hasCollectedToday = jest.fn().mockResolvedValue(false)
      mockMetricsCollector.getLatestMetrics = jest.fn().mockResolvedValue(mockMetrics)

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        hasCollectedToday: false,
        latestMetrics: mockMetrics,
        message: 'No metrics collected today'
      })
    })

    it('should handle case when no metrics exist', async () => {
      mockMetricsCollector.hasCollectedToday = jest.fn().mockResolvedValue(false)
      mockMetricsCollector.getLatestMetrics = jest.fn().mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        hasCollectedToday: false,
        latestMetrics: null,
        message: 'No metrics collected today'
      })
    })

    it('should handle errors when checking status', async () => {
      const error = new Error('Database connection failed')
      mockMetricsCollector.hasCollectedToday = jest.fn().mockRejectedValue(error)

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to check metrics status',
        details: 'Database connection failed'
      })

      expect(console.error).toHaveBeenCalledWith('Error checking metrics status:', error)
    })

    it('should handle unknown errors when checking status', async () => {
      mockMetricsCollector.hasCollectedToday = jest.fn().mockRejectedValue('Unknown error')

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to check metrics status',
        details: 'Unknown error'
      })
    })

    it('should handle errors from getLatestMetrics', async () => {
      mockMetricsCollector.hasCollectedToday = jest.fn().mockResolvedValue(false)
      mockMetricsCollector.getLatestMetrics = jest.fn().mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/github/collect')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to check metrics status',
        details: 'Database error'
      })
    })
  })
})