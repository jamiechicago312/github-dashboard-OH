import { NextRequest, NextResponse } from 'next/server'
import MetricsCollector from '@/lib/metrics-collector'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Manual metrics collection triggered')
    
    // Collect current metrics
    const metrics = await MetricsCollector.collectCurrentMetrics()
    
    return NextResponse.json({
      success: true,
      message: 'Metrics collected successfully',
      data: metrics
    })
  } catch (error) {
    console.error('Error collecting metrics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to collect metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if metrics have been collected today
    const hasCollected = MetricsCollector.hasCollectedToday()
    const latest = MetricsCollector.getLatestMetrics()
    
    return NextResponse.json({
      success: true,
      hasCollectedToday: hasCollected,
      latestMetrics: latest,
      message: hasCollected ? 'Metrics already collected today' : 'No metrics collected today'
    })
  } catch (error) {
    console.error('Error checking metrics status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check metrics status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}