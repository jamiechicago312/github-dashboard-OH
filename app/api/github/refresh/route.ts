import { NextResponse } from 'next/server'
import { SimpleCache } from '@/lib/simple-cache'

export async function POST() {
  try {
    const canRefresh = await SimpleCache.canRefresh()
    
    if (!canRefresh) {
      const status = await SimpleCache.getStatus()
      const timeUntilNext = status.timeUntilNextRefresh
      const minutes = Math.ceil(timeUntilNext / 1000 / 60)
      const nextHour = status.nextRefreshAvailable?.toLocaleTimeString('en-US', { 
        timeZone: 'UTC', 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      
      return NextResponse.json({
        success: false,
        message: `Data refreshes at the top of every hour (UTC). Next refresh available at ${nextHour} UTC (${minutes} minutes).`,
        nextRefreshAvailable: status.nextRefreshAvailable,
        timeUntilNextRefresh: timeUntilNext
      }, { status: 429 }) // Too Many Requests
    }

    // Clear cache to force refresh on next request
    await SimpleCache.clear()
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared. Next dashboard request will fetch fresh data.',
      refreshedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in refresh endpoint:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to refresh data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const status = await SimpleCache.getStatus()
    
    return NextResponse.json({
      canRefresh: status.canRefresh,
      lastRefresh: status.lastRefresh,
      nextRefreshAvailable: status.nextRefreshAvailable,
      timeUntilNextRefresh: status.timeUntilNextRefresh,
      hasCache: status.hasCache
    })
  } catch (error) {
    console.error('Error getting refresh status:', error)
    return NextResponse.json(
      { error: 'Failed to get refresh status' },
      { status: 500 }
    )
  }
}