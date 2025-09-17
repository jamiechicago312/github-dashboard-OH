import { NextRequest, NextResponse } from 'next/server'
import DatabaseAdapter from '@/lib/database-adapter'

export const dynamic = 'force-dynamic'

interface TrendData {
  stars: { current: number; previous: number; change: number; changePercent: number }
  forks: { current: number; previous: number; change: number; changePercent: number }
  contributors: { current: number; previous: number; change: number; changePercent: number }
}

export async function GET(request: NextRequest) {
  try {
    const db = DatabaseAdapter
    
    // Get current metrics (latest)
    const latest = await db.getLatestMetrics()
    
    if (!latest) {
      return NextResponse.json({
        success: false,
        error: 'No current metrics available'
      }, { status: 404 })
    }

    // Get metrics from 30 days ago for comparison
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Get metrics from around 30 days ago using range query
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    const historicalMetrics = await db.getMetricsInRange(thirtyDaysAgoStr, thirtyDaysAgoStr)
    
    const historical = historicalMetrics.length > 0 ? historicalMetrics[0] : null
    
    // If no historical data, use current as baseline
    const baseline = historical || {
      stars: latest.stars,
      forks: latest.forks,
      contributors: latest.contributors
    }

    const calculateChange = (current: number, previous: number) => {
      const change = current - previous
      const changePercent = previous > 0 ? (change / previous) * 100 : 0
      return { current, previous, change, changePercent }
    }

    const trends: TrendData = {
      stars: calculateChange(latest.stars, baseline.stars),
      forks: calculateChange(latest.forks, baseline.forks),
      contributors: calculateChange(latest.contributors, baseline.contributors)
    }

    return NextResponse.json({
      success: true,
      data: trends,
      period: '30 days',
      latestDate: latest.date,
      baselineDate: historical?.date || latest.date
    })
  } catch (error) {
    console.error('Error fetching trend data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trend data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}