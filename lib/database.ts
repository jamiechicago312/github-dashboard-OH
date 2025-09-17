import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'metrics.db')

// Ensure data directory exists
import fs from 'fs'
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS repository_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    date TEXT NOT NULL,
    stars INTEGER NOT NULL,
    forks INTEGER NOT NULL,
    contributors INTEGER NOT NULL,
    open_issues INTEGER NOT NULL,
    closed_issues INTEGER NOT NULL,
    open_prs INTEGER NOT NULL,
    closed_prs INTEGER NOT NULL,
    merged_prs INTEGER NOT NULL,
    commits INTEGER NOT NULL,
    releases INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_repository_metrics_date ON repository_metrics(date);
  CREATE INDEX IF NOT EXISTS idx_repository_metrics_timestamp ON repository_metrics(timestamp);
`)

export interface RepositoryMetricsRecord {
  id?: number
  timestamp: number
  date: string
  stars: number
  forks: number
  contributors: number
  open_issues: number
  closed_issues: number
  open_prs: number
  closed_prs: number
  merged_prs: number
  commits: number
  releases: number
  created_at?: number
}

export interface TimeRangeMetrics {
  current: RepositoryMetricsRecord
  previous?: RepositoryMetricsRecord | null
  change?: {
    stars: number
    forks: number
    contributors: number
    open_issues: number
    closed_issues: number
    open_prs: number
    closed_prs: number
    merged_prs: number
    commits: number
    releases: number
  }
}

export class MetricsDatabase {
  private static instance: MetricsDatabase
  private db: Database.Database

  private constructor() {
    this.db = db
  }

  static getInstance(): MetricsDatabase {
    if (!MetricsDatabase.instance) {
      MetricsDatabase.instance = new MetricsDatabase()
    }
    return MetricsDatabase.instance
  }

  /**
   * Store daily metrics snapshot
   */
  storeMetrics(metrics: Omit<RepositoryMetricsRecord, 'id' | 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO repository_metrics 
      (timestamp, date, stars, forks, contributors, open_issues, closed_issues, 
       open_prs, closed_prs, merged_prs, commits, releases)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      metrics.timestamp,
      metrics.date,
      metrics.stars,
      metrics.forks,
      metrics.contributors,
      metrics.open_issues,
      metrics.closed_issues,
      metrics.open_prs,
      metrics.closed_prs,
      metrics.merged_prs,
      metrics.commits,
      metrics.releases
    )
  }

  /**
   * Get metrics for a specific date range
   */
  getMetricsInRange(startDate: string, endDate: string): RepositoryMetricsRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM repository_metrics 
      WHERE date >= ? AND date <= ? 
      ORDER BY date ASC
    `)
    return stmt.all(startDate, endDate) as RepositoryMetricsRecord[]
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(): RepositoryMetricsRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM repository_metrics 
      ORDER BY timestamp DESC 
      LIMIT 1
    `)
    return stmt.get() as RepositoryMetricsRecord | null
  }

  /**
   * Get metrics for specific time periods with comparison
   */
  getTimeRangeMetrics(days: number): TimeRangeMetrics | null {
    const now = new Date()
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
    
    const currentStmt = this.db.prepare(`
      SELECT * FROM repository_metrics 
      WHERE timestamp >= ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `)
    
    const previousStmt = this.db.prepare(`
      SELECT * FROM repository_metrics 
      WHERE timestamp < ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `)
    
    const current = currentStmt.get(startDate.getTime()) as RepositoryMetricsRecord | null
    const previous = previousStmt.get(startDate.getTime()) as RepositoryMetricsRecord | null
    
    if (!current) return null
    
    const change = previous ? {
      stars: current.stars - previous.stars,
      forks: current.forks - previous.forks,
      contributors: current.contributors - previous.contributors,
      open_issues: current.open_issues - previous.open_issues,
      closed_issues: current.closed_issues - previous.closed_issues,
      open_prs: current.open_prs - previous.open_prs,
      closed_prs: current.closed_prs - previous.closed_prs,
      merged_prs: current.merged_prs - previous.merged_prs,
      commits: current.commits - previous.commits,
      releases: current.releases - previous.releases,
    } : undefined
    
    return { current, previous, change }
  }

  /**
   * Get all available dates for metrics
   */
  getAvailableDates(): string[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT date FROM repository_metrics 
      ORDER BY date DESC
    `)
    return stmt.all().map((row: any) => row.date)
  }

  /**
   * Clean up old metrics (keep last 2 years)
   */
  cleanupOldMetrics(): void {
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    
    const stmt = this.db.prepare(`
      DELETE FROM repository_metrics 
      WHERE timestamp < ?
    `)
    stmt.run(twoYearsAgo.getTime())
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close()
  }
}

export default MetricsDatabase.getInstance()