'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BarChart3, TrendingUp, TrendingDown, Minus, Calendar, GitCommit, GitPullRequest, Bug, Package } from 'lucide-react'
import { TimeRangeOption, TimeBasedMetrics } from '@/types/github'
import DateRangeSelector from './date-range-selector'
import { LoadingCard } from './loading-card'

const TIME_RANGES: TimeRangeOption[] = [
  { label: 'All Time', value: 'all-time' },
  { label: '1 Year', value: '1-year', days: 365 },
  { label: '6 Months', value: '6-months', days: 180 },
  { label: '3 Months', value: '3-months', days: 90 },
  { label: '1 Month', value: '1-month', days: 30 },
  { label: '1 Week', value: '1-week', days: 7 },
  { label: '24 Hours', value: '24-hours', days: 1 },
]

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ActivityMetric {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

export default function GranularActivityOverview() {
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>(TIME_RANGES[4]) // Default to 1 Month

  const { data: timeBasedMetrics, error, isLoading } = useSWR<TimeBasedMetrics>(
    `/api/github/metrics?range=${selectedRange.value}`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  )

  if (isLoading) return <LoadingCard />

  if (error) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-heading font-semibold mb-4 flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Granular Activity Overview</span>
        </h3>
        <div className="text-center text-muted-foreground">
          <p>Failed to load activity data</p>
        </div>
      </div>
    )
  }

  if (!timeBasedMetrics) return null

  const metrics: ActivityMetric[] = [
    {
      label: 'Commits',
      value: timeBasedMetrics.commits,
      icon: GitCommit,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Open Issues',
      value: timeBasedMetrics.open_issues,
      icon: Bug,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Closed Issues',
      value: timeBasedMetrics.closed_issues,
      icon: Bug,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Open PRs',
      value: timeBasedMetrics.open_prs,
      icon: GitPullRequest,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Closed PRs',
      value: timeBasedMetrics.closed_prs,
      icon: GitPullRequest,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      label: 'Releases',
      value: timeBasedMetrics.releases,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  // Calculate total activity
  const totalActivity = metrics.reduce((sum, metric) => sum + metric.value, 0)

  // Get trend indicator
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Granular Activity Overview</span>
        </h3>
        <DateRangeSelector
          ranges={TIME_RANGES}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
      </div>

      {/* Summary Stats */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Activity</p>
            <p className="text-2xl font-bold">{totalActivity.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Time Period</p>
            <p className="text-lg font-semibold">{selectedRange.label}</p>
          </div>
        </div>
      </div>

      {/* Activity Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          const percentage = totalActivity > 0 ? ((metric.value / totalActivity) * 100) : 0
          
          return (
            <div key={index} className="p-4 rounded-lg border bg-background hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                {getTrendIcon(0)} {/* TODO: Add actual trend calculation */}
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(1)}% of total</span>
                  <span>in {selectedRange.label.toLowerCase()}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full bg-muted rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${metric.color.replace('text-', 'bg-')}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Activity Breakdown */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-semibold mb-4 flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Activity Breakdown</span>
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Issues Activity</p>
            <p className="font-semibold text-lg">
              {(timeBasedMetrics.open_issues + timeBasedMetrics.closed_issues).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {timeBasedMetrics.open_issues} open, {timeBasedMetrics.closed_issues} closed
            </p>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">PR Activity</p>
            <p className="font-semibold text-lg">
              {(timeBasedMetrics.open_prs + timeBasedMetrics.closed_prs).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {timeBasedMetrics.open_prs} open, {timeBasedMetrics.closed_prs} closed
            </p>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Development</p>
            <p className="font-semibold text-lg">{timeBasedMetrics.commits.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">commits</p>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Releases</p>
            <p className="font-semibold text-lg">{timeBasedMetrics.releases.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">published</p>
          </div>
        </div>
      </div>
    </div>
  )
}