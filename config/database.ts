/**
 * Database configuration for different environments
 * Supports both SQLite (local development) and Neon PostgreSQL (production)
 */

import SQLiteDatabase from '../lib/database'
import NeonDatabase from '../lib/database-neon'

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
  // Check for Neon/PostgreSQL first (DATABASE_URL or Neon-specific vars)
  if (process.env.DATABASE_URL || process.env.NEON_HOST) {
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL)
      
      if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
        return {
          type: 'postgresql',
          host: url.hostname,
          port: parseInt(url.port) || 5432,
          database: url.pathname.slice(1),
          username: url.username,
          password: url.password,
          ssl: true
        }
      }
    }
    
    // Neon-specific environment variables
    if (process.env.NEON_HOST) {
      return {
        type: 'postgresql',
        host: process.env.NEON_HOST,
        port: parseInt(process.env.NEON_PORT || '5432'),
        database: process.env.NEON_DATABASE || 'neondb',
        username: process.env.NEON_USERNAME,
        password: process.env.NEON_PASSWORD,
        ssl: true
      }
    }
  }
  
  // Default to SQLite for development or when no PostgreSQL config is found
  return {
    type: 'sqlite',
    path: process.env.DATABASE_PATH || './data/metrics.db'
  }
}

export function getDatabase() {
  const config = getDatabaseConfig()
  
  if (config.type === 'postgresql') {
    console.log('🐘 Using Neon PostgreSQL database')
    return NeonDatabase
  }
  
  console.log('📁 Using SQLite database')
  return SQLiteDatabase
}

export function isDatabaseConfigured(): boolean {
  return !!(process.env.DATABASE_URL || process.env.NEON_HOST)
}

export function getDatabaseType(): 'sqlite' | 'postgresql' {
  const config = getDatabaseConfig()
  return config.type === 'postgresql' ? 'postgresql' : 'sqlite'
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