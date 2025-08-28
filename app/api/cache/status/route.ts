import { NextResponse } from 'next/server'
import { cache } from '@/lib/cache'

export async function GET() {
  try {
    const stats = cache.getStats()
    
    return NextResponse.json({
      cacheSize: stats.size,
      cachedKeys: stats.keys,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting cache status:', error)
    return NextResponse.json(
      { error: 'Failed to get cache status' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    cache.clear()
    
    return NextResponse.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}