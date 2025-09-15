/**
 * API endpoints for managing the data collection scheduler
 */

import { NextRequest, NextResponse } from 'next/server'
import DataCollectionScheduler from '@/lib/scheduler'
import MetricsCollector from '@/lib/metrics-collector'

// GET /api/scheduler - Get scheduler status and statistics
export async function GET() {
  try {
    const scheduler = DataCollectionScheduler.getInstance()
    const collector = MetricsCollector
    
    const stats = scheduler.getStats()
    const config = scheduler.getConfig()
    const health = collector.getHealthStatus()
    
    return NextResponse.json({
      success: true,
      data: {
        scheduler: {
          isRunning: stats.isRunning,
          isHealthy: scheduler.isHealthy(),
          stats,
          config
        },
        collector: {
          health
        }
      }
    })
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduler status' },
      { status: 500 }
    )
  }
}

// POST /api/scheduler - Control scheduler operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config } = body
    
    const scheduler = DataCollectionScheduler.getInstance()
    
    switch (action) {
      case 'start':
        scheduler.start()
        return NextResponse.json({
          success: true,
          message: 'Scheduler started successfully'
        })
        
      case 'stop':
        scheduler.stop()
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped successfully'
        })
        
      case 'collect':
        await scheduler.collectNow()
        return NextResponse.json({
          success: true,
          message: 'Manual collection completed successfully'
        })
        
      case 'configure':
        if (config) {
          scheduler.updateConfig(config)
          return NextResponse.json({
            success: true,
            message: 'Scheduler configuration updated successfully'
          })
        }
        return NextResponse.json(
          { success: false, error: 'Configuration data required' },
          { status: 400 }
        )
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, collect, or configure' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error controlling scheduler:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to control scheduler' },
      { status: 500 }
    )
  }
}