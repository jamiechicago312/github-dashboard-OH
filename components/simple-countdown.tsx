'use client'

import { useState, useEffect } from 'react'

export function SimpleCountdown() {
  const [countdown, setCountdown] = useState<string>('')

  useEffect(() => {
    const fetchAndUpdateCountdown = async () => {
      try {
        const response = await fetch('/api/github/refresh')
        const data = await response.json()

        if (data.canRefresh) {
          setCountdown('')
          return
        }

        const nextRefreshAvailable = new Date(data.nextRefreshAvailable)

        const updateCountdown = () => {
          const now = new Date()
          const timeLeft = nextRefreshAvailable.getTime() - now.getTime()

          if (timeLeft <= 0) {
            setCountdown('')
            return
          }

          const minutes = Math.floor(timeLeft / 1000 / 60)
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
          setCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
      } catch (error) {
        console.error('Failed to fetch refresh status:', error)
        setCountdown('')
      }
    }

    fetchAndUpdateCountdown()
    const interval = setInterval(fetchAndUpdateCountdown, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (!countdown) return null

  return (
    <span className="text-xs text-muted-foreground font-mono">
      [{countdown} time until refresh]
    </span>
  )
}