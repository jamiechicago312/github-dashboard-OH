/**
 * Tests for database health checker functionality
 */

import { DatabaseHealthChecker } from '../lib/database-health'

// Mock the database adapter
jest.mock('../lib/database-adapter', () => ({
  getHealthStatus: jest.fn()
}))

// Mock the database config
jest.mock('../config/database', () => ({
  getDatabaseConfig: jest.fn(),
  getDatabaseType: jest.fn(),
  isDatabaseConfigured: jest.fn()
}))

import DatabaseAdapter from '../lib/database-adapter'
import { getDatabaseConfig, getDatabaseType, isDatabaseConfigured } from '../config/database'

const mockDatabaseAdapter = DatabaseAdapter as jest.Mocked<typeof DatabaseAdapter>
const mockGetDatabaseConfig = getDatabaseConfig as jest.MockedFunction<typeof getDatabaseConfig>
const mockGetDatabaseType = getDatabaseType as jest.MockedFunction<typeof getDatabaseType>
const mockIsDatabaseConfigured = isDatabaseConfigured as jest.MockedFunction<typeof isDatabaseConfigured>

describe('DatabaseHealthChecker', () => {
  let healthChecker: DatabaseHealthChecker
  
  beforeEach(() => {
    healthChecker = DatabaseHealthChecker.getInstance()
    jest.clearAllMocks()
    
    // Reset environment variables
    delete process.env.DATABASE_URL
    delete process.env.NEON_HOST
    delete process.env.GITHUB_OWNER
    delete process.env.GITHUB_REPO
    delete process.env.GITHUB_TOKEN
  })

  describe('SQLite fallback scenario', () => {
    beforeEach(() => {
      mockGetDatabaseType.mockReturnValue('sqlite')
      mockIsDatabaseConfigured.mockReturnValue(false)
      mockGetDatabaseConfig.mockReturnValue({
        type: 'sqlite',
        path: './data/metrics.db'
      })
    })

    it('should detect SQLite fallback with no data', async () => {
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: false,
        lastCollection: null,
        recordCount: 0,
        oldestRecord: null,
        newestRecord: null
      })

      const report = await healthChecker.getHealthReport()

      expect(report.type).toBe('sqlite')
      expect(report.configDetails.usingFallback).toBe(true)
      expect(report.configDetails.usingNeon).toBe(false)
      expect(report.hasData).toBe(false)
      expect(report.issues).toContain('Using SQLite database instead of Neon PostgreSQL')
      expect(report.issues).toContain('No metrics data found in database')
      expect(report.recommendations).toContain('Configure Neon database by setting DATABASE_URL environment variable')
    })

    it('should detect SQLite fallback with data', async () => {
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: true,
        lastCollection: new Date().toISOString(),
        recordCount: 5,
        oldestRecord: '2024-01-01',
        newestRecord: '2024-01-05'
      })

      const report = await healthChecker.getHealthReport()

      expect(report.type).toBe('sqlite')
      expect(report.hasData).toBe(true)
      expect(report.recordCount).toBe(5)
      expect(report.issues).toContain('Using SQLite database instead of Neon PostgreSQL')
      expect(report.issues).not.toContain('No metrics data found in database')
    })

    it('should provide correct status summary for SQLite with data', async () => {
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: true,
        lastCollection: new Date().toISOString(),
        recordCount: 3,
        oldestRecord: '2024-01-01',
        newestRecord: '2024-01-03'
      })

      const summary = await healthChecker.getStatusSummary()

      expect(summary).toBe('⚠️  Using SQLite fallback database (3 records). Configure Neon for production use.')
    })

    it('should provide correct status summary for SQLite without data', async () => {
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: false,
        lastCollection: null,
        recordCount: 0,
        oldestRecord: null,
        newestRecord: null
      })

      const summary = await healthChecker.getStatusSummary()

      expect(summary).toBe('❌ No data found. Database is using SQLite fallback and no metrics have been collected.')
    })
  })

  describe('Neon PostgreSQL scenario', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host.neon.tech/db?sslmode=require'
      mockGetDatabaseType.mockReturnValue('postgresql')
      mockIsDatabaseConfigured.mockReturnValue(true)
      mockGetDatabaseConfig.mockReturnValue({
        type: 'postgresql',
        host: 'host.neon.tech',
        port: 5432,
        database: 'db',
        username: 'user',
        password: 'pass',
        ssl: true
      })
    })

    it('should detect healthy Neon database', async () => {
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: true,
        lastCollection: new Date().toISOString(),
        recordCount: 10,
        oldestRecord: '2024-01-01',
        newestRecord: '2024-01-10'
      })

      const report = await healthChecker.getHealthReport()

      expect(report.type).toBe('postgresql')
      expect(report.configDetails.usingNeon).toBe(true)
      expect(report.configDetails.usingFallback).toBe(false)
      expect(report.hasData).toBe(true)
      expect(report.recordCount).toBe(10)
      expect(report.configDetails.host).toBe('host.neon.tech')
      expect(report.configDetails.database).toBe('db')
      expect(report.issues).not.toContain('Using SQLite database instead of Neon PostgreSQL')
    })

    it('should provide correct status summary for healthy Neon', async () => {
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: true,
        lastCollection: new Date().toISOString(),
        recordCount: 15,
        oldestRecord: '2024-01-01',
        newestRecord: '2024-01-15'
      })

      const summary = await healthChecker.getStatusSummary()

      expect(summary).toBe('✅ Neon database is configured and working properly (15 records)')
    })

    it('should detect Neon connection issues', async () => {
      mockDatabaseAdapter.getHealthStatus.mockRejectedValue(new Error('Connection failed'))

      const report = await healthChecker.getHealthReport()

      expect(report.issues).toContain('Database connection failed: Connection failed')
      expect(report.recommendations).toContain('Check database configuration and connectivity')
    })
  })

  describe('Missing configuration detection', () => {
    beforeEach(() => {
      mockGetDatabaseType.mockReturnValue('sqlite')
      mockIsDatabaseConfigured.mockReturnValue(false)
      mockGetDatabaseConfig.mockReturnValue({
        type: 'sqlite',
        path: './data/metrics.db'
      })
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: true,
        lastCollection: new Date().toISOString(),
        recordCount: 1,
        oldestRecord: '2024-01-01',
        newestRecord: '2024-01-01'
      })
    })

    it('should detect missing GitHub configuration', async () => {
      // No GitHub env vars set
      const report = await healthChecker.getHealthReport()

      expect(report.issues).toContain('GitHub repository configuration is incomplete')
      expect(report.recommendations).toContain('Set GITHUB_OWNER and GITHUB_REPO environment variables')
    })

    it('should detect missing GitHub token', async () => {
      process.env.GITHUB_OWNER = 'owner'
      process.env.GITHUB_REPO = 'repo'
      // GITHUB_TOKEN not set

      const report = await healthChecker.getHealthReport()

      expect(report.issues).toContain('GitHub API token is not configured')
      expect(report.recommendations).toContain('Set GITHUB_TOKEN environment variable with a valid GitHub Personal Access Token')
    })

    it('should not report GitHub issues when properly configured', async () => {
      process.env.GITHUB_OWNER = 'owner'
      process.env.GITHUB_REPO = 'repo'
      process.env.GITHUB_TOKEN = 'token'

      const report = await healthChecker.getHealthReport()

      expect(report.issues).not.toContain('GitHub repository configuration is incomplete')
      expect(report.issues).not.toContain('GitHub API token is not configured')
    })
  })

  describe('Stale data detection', () => {
    beforeEach(() => {
      mockGetDatabaseType.mockReturnValue('sqlite')
      mockIsDatabaseConfigured.mockReturnValue(false)
      mockGetDatabaseConfig.mockReturnValue({
        type: 'sqlite',
        path: './data/metrics.db'
      })
    })

    it('should detect stale data (string timestamp)', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: true,
        lastCollection: twoDaysAgo,
        recordCount: 1,
        oldestRecord: '2024-01-01',
        newestRecord: '2024-01-01'
      })

      const report = await healthChecker.getHealthReport()

      expect(report.issues.some(issue => issue.includes('Data is stale'))).toBe(true)
      expect(report.recommendations).toContain('Check if automated scheduler is running')
    })

    it('should detect stale data (numeric timestamp)', async () => {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000
      
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: true,
        lastCollection: twoDaysAgo, // Pass as number, not string
        recordCount: 1,
        oldestRecord: '2024-01-01',
        newestRecord: '2024-01-01'
      })

      const report = await healthChecker.getHealthReport()

      expect(report.issues.some(issue => issue.includes('Data is stale'))).toBe(true)
    })

    it('should not report stale data for recent collections', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      mockDatabaseAdapter.getHealthStatus.mockResolvedValue({
        isHealthy: true,
        lastCollection: oneHourAgo,
        recordCount: 1,
        oldestRecord: '2024-01-01',
        newestRecord: '2024-01-01'
      })

      const report = await healthChecker.getHealthReport()

      expect(report.issues.some(issue => issue.includes('Data is stale'))).toBe(false)
    })
  })
})