'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils'

interface RefreshStatusProps {
  cacheInfo?: {
    cached: boolean
    lastRefresh: string | null
    nextRefreshAvailable: string | null
  }
  onRefresh?: () => void
}

export function RefreshStatus({ cacheInfo, onRefresh }: RefreshStatusProps) {
  const [refreshStatus, setRefreshStatus] = useState<{
    canRefresh: boolean
    timeUntilNextRefresh: number
    lastRefresh: Date | null
    nextRefreshAvailable: Date | null
  } | null>(null)
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [countdown, setCountdown] = useState<string>('')

  // Fetch refresh status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/github/refresh')
        const data = await response.json()
        setRefreshStatus({
          canRefresh: data.canRefresh,
          timeUntilNextRefresh: data.timeUntilNextRefresh,
          lastRefresh: data.lastRefresh ? new Date(data.lastRefresh) : null,
          nextRefreshAvailable: data.nextRefreshAvailable ? new Date(data.nextRefreshAvailable) : null
        })
      } catch (error) {
        console.error('Failed to fetch refresh status:', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (!refreshStatus || refreshStatus.canRefresh) {
      setCountdown('')
      return
    }

    const updateCountdown = () => {
      if (!refreshStatus.nextRefreshAvailable) return

      const now = new Date()
      const timeLeft = refreshStatus.nextRefreshAvailable.getTime() - now.getTime()
      
      if (timeLeft <= 0) {
        setCountdown('')
        setRefreshStatus(prev => prev ? { ...prev, canRefresh: true } : null)
        return
      }

      const minutes = Math.floor(timeLeft / 1000 / 60)
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  const handleRefresh = async () => {
    if (!refreshStatus?.canRefresh || isRefreshing) return

    setIsRefreshing(true)
    try {
      const response = await fetch('/api/github/refresh', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        // Trigger parent refresh
        onRefresh?.()
        
        // Update status to show we just refreshed
        setRefreshStatus(prev => prev ? {
          ...prev,
          canRefresh: false,
          lastRefresh: new Date(),
          nextRefreshAvailable: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        } : null)
      } else {
        // Show error message (rate limited)
        alert(data.message)
      }
    } catch (error) {
      console.error('Refresh failed:', error)
      alert('Failed to refresh data. Please try again.')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!refreshStatus) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Loading refresh status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Last refresh info */}
          {refreshStatus.lastRefresh && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>
                Last updated {formatRelativeTime(refreshStatus.lastRefresh)}
              </span>
            </div>
          )}

          {/* Refresh button or countdown */}
          {refreshStatus.canRefresh ? (
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          ) : (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Next refresh in</span>
              </div>
              <div className="text-2xl font-mono font-bold text-primary">
                {countdown || '0:00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Only 1 refresh per hour to prevent API limits
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}