/**
 * API endpoint for database health check and configuration status
 */

import { NextResponse } from 'next/server'
import DatabaseHealthChecker from '@/lib/database-health'

// GET /api/database/health - Get detailed database health report
export async function GET() {
  try {
    const healthChecker = DatabaseHealthChecker
    const report = await healthChecker.getHealthReport()
    const summary = await healthChecker.getStatusSummary()

    return NextResponse.json({
      success: true,
      summary,
      data: report
    })
  } catch (error) {
    console.error('Error getting database health:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get database health status',
        summary: '❌ Database health check failed'
      },
      { status: 500 }
    )
  }
}