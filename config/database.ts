/**
 * Database configuration for different environments
 */

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql'
  path?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl?: boolean
}

export const getDatabaseConfig = (): DatabaseConfig => {
  const env = process.env.NODE_ENV || 'development'
  
  // Production database configuration
  if (env === 'production') {
    // Check for cloud database configuration
    if (process.env.DATABASE_URL) {
      // Parse DATABASE_URL for cloud providers (Vercel, Railway, etc.)
      const url = new URL(process.env.DATABASE_URL)
      return {
        type: url.protocol.replace(':', '') as 'postgresql' | 'mysql',
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'postgresql:' ? 5432 : 3306),
        database: url.pathname.slice(1),
        username: url.username,
        password: url.password,
        ssl: true
      }
    }
    
    // Fallback to SQLite for production if no cloud DB configured
    return {
      type: 'sqlite',
      path: process.env.DATABASE_PATH || '/tmp/metrics.db'
    }
  }
  
  // Development configuration
  return {
    type: 'sqlite',
    path: process.env.DATABASE_PATH || './data/metrics.db'
  }
}

export const getDataDirectory = (): string => {
  const env = process.env.NODE_ENV || 'development'
  
  if (env === 'production') {
    // Use system temp directory for production
    return process.env.DATA_DIR || '/tmp/github-dashboard'
  }
  
  // Use local data directory for development
  return process.env.DATA_DIR || './data'
}