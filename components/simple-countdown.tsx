'use client'

import { useState, useEffect } from 'react'

export function SimpleCountdown() {
  const [countdown, setCountdown] = useState<string>('')

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null
    let fetchInterval: NodeJS.Timeout | null = null

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
            if (countdownInterval) {
              clearInterval(countdownInterval)
              countdownInterval = null
            }
            return
          }

          const minutes = Math.floor(timeLeft / 1000 / 60)
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
          setCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        }

        updateCountdown()
        if (countdownInterval) clearInterval(countdownInterval)
        countdownInterval = setInterval(updateCountdown, 1000)
      } catch (error) {
        console.error('Failed to fetch refresh status:', error)
        setCountdown('')
      }
    }

    fetchAndUpdateCountdown()
    fetchInterval = setInterval(fetchAndUpdateCountdown, 30000) // Update every 30 seconds
    
    return () => {
      if (countdownInterval) clearInterval(countdownInterval)
      if (fetchInterval) clearInterval(fetchInterval)
    }
  }, [])

  if (!countdown) return null

  return (
    <div className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md border text-xs font-mono transition-all duration-200 hover:shadow-md hover:bg-secondary/80">
      [{countdown} time until refresh]
    </div>
  )
}