'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { RepositoryStats, TimeRangeOption, TimeBasedMetrics } from '@/types/github'
import DateRangeSelector from './date-range-selector'

interface EnhancedRepositoryMetricsProps {
  stats: RepositoryStats
}

const TIME_RANGES: TimeRangeOption[] = [
  { label: 'All Time', value: 'all-time' },
  { label: '1 Year', value: '1-year', days: 365 },
  { label: '1 Month', value: '1-month', days: 30 },
  { label: '1 Week', value: '1-week', days: 7 },
  { label: '24 Hours', value: '24-hours', days: 1 },
]

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function EnhancedRepositoryMetrics({ stats }: EnhancedRepositoryMetricsProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>(TIME_RANGES[0])

  const { data: timeBasedMetrics, error, isLoading } = useSWR<TimeBasedMetrics>(
    `/api/github/metrics?range=${selectedRange.value}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  // Use time-based stats if available, otherwise fall back to default stats
  const currentStats = timeBasedMetrics?.stats || stats

  const metrics = [
    {
      label: 'Open Issues',
      value: currentStats.issues.open.toLocaleString(),
      color: 'bg-red-500',
      icon: '🐛',
    },
    {
      label: 'Closed Issues',
      value: currentStats.issues.closed.toLocaleString(),
      color: 'bg-green-500',
      icon: '✅',
    },
    {
      label: 'Commits',
      value: currentStats.commits.toLocaleString(),
      color: 'bg-blue-500',
      icon: '📝',
    },
    {
      label: 'Open PRs',
      value: currentStats.pullRequests.open.toLocaleString(),
      color: 'bg-yellow-500',
      icon: '🔄',
    },
    {
      label: 'Closed PRs',
      value: currentStats.pullRequests.closed.toLocaleString(),
      color: 'bg-purple-500',
      icon: '🔀',
    },
    {
      label: 'Releases',
      value: currentStats.releases.toLocaleString(),
      color: 'bg-indigo-500',
      icon: '🚀',
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Repository Metrics</h2>
        <DateRangeSelector
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
          ranges={TIME_RANGES}
        />
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        {isLoading && selectedRange.value !== 'all-time' ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading metrics...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>Failed to load metrics for {selectedRange.label}</p>
            <p className="text-sm text-gray-500 mt-1">Showing all-time data instead</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <div className={`w-16 h-16 ${metric.color} rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                  <span className="text-2xl">{metric.icon}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <p className="text-sm text-gray-600">{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Time Range Info */}
        {selectedRange.value !== 'all-time' && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              Showing data for: <span className="font-medium">{selectedRange.label}</span>
              {timeBasedMetrics && (
                <span className="ml-2">
                  ({timeBasedMetrics.commits.length} commits, {timeBasedMetrics.pullRequests.length} PRs, {timeBasedMetrics.issues.length} issues)
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}