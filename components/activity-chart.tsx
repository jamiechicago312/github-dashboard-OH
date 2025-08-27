'use client'

import useSWR from 'swr'
import { BarChart3, TrendingUp, Calendar } from 'lucide-react'
import { DashboardData } from '@/types/github'
import { formatNumber, formatDate } from '@/lib/utils'
import { LoadingCard } from './loading-card'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ActivityChart() {
  const { data, error, isLoading } = useSWR<DashboardData>('/api/github/dashboard', fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  })

  if (isLoading) return <LoadingCard />

  if (error) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-semibold mb-4 flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Activity Overview</span>
        </h3>
        <div className="text-center text-muted-foreground">
          <p>Failed to load activity data</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { recentCommits, recentPullRequests, recentIssues, contributors, externalContributors } = data

  // Group commits by date for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  const commitsByDate = last7Days.map(date => {
    const commitsOnDate = recentCommits.filter(commit => 
      commit.commit.author.date.startsWith(date)
    )
    return {
      date,
      commits: commitsOnDate.length,
      displayDate: formatDate(date),
    }
  })

  const maxCommits = Math.max(...commitsByDate.map(d => d.commits), 1)

  // Calculate activity stats
  const totalExternalContributions = externalContributors.reduce((sum, c) => sum + c.contributions, 0)
  const totalContributions = contributors.reduce((sum, c) => sum + c.contributions, 0)
  const externalPercentage = totalContributions > 0 ? Math.round((totalExternalContributions / totalContributions) * 100) : 0

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Activity Overview</span>
        </h3>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Last 7 days</span>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold text-green-600">{externalPercentage}%</div>
          <div className="text-sm text-muted-foreground">External Contributions</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold">{formatNumber(recentCommits.length)}</div>
          <div className="text-sm text-muted-foreground">Recent Commits</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold">{formatNumber(recentPullRequests.length)}</div>
          <div className="text-sm text-muted-foreground">Recent Pull Requests</div>
        </div>
      </div>

      {/* Simple Commit Activity Chart */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <span>Daily Commit Activity</span>
        </h4>
        
        <div className="space-y-2">
          {commitsByDate.map((day) => (
            <div key={day.date} className="flex items-center space-x-3">
              <div className="w-16 text-xs text-muted-foreground text-right">
                {day.displayDate.split(' ')[1]} {day.displayDate.split(' ')[0]}
              </div>
              <div className="flex-1 flex items-center space-x-2">
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(day.commits / maxCommits) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-right">
                  {day.commits}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {commitsByDate.every(day => day.commits === 0) && (
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No commit activity in the last 7 days</p>
          </div>
        )}
      </div>

      {/* External Contributors Highlight */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Community Impact</h4>
            <p className="text-sm text-muted-foreground">
              {formatNumber(externalContributors.length)} external contributors have made{' '}
              {formatNumber(totalExternalContributions)} contributions
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-primary">
              {externalPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">
              of all contributions
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}