'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  AlertCircle, 
  Tag,
  ExternalLink,
  Calendar,
  Clock
} from 'lucide-react'
import { DashboardData } from '@/types/github'
import { formatNumber, formatRelativeTime, getLanguageColor } from '@/lib/utils'
import { LoadingCard } from './loading-card'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function RepositoryMetrics() {
  const { data, error, isLoading } = useSWR<DashboardData>('/api/github/dashboard', fetcher, {
    refreshInterval: 900000, // Refresh every 15 minutes
    revalidateOnReconnect: false, // Don't refetch on network reconnect
    dedupingInterval: 300000, // Dedupe requests within 5 minutes
    revalidateOnFocus: false,
  })

  if (isLoading) return <LoadingCard />

  if (error) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-heading font-semibold mb-4">Repository Metrics</h3>
        <div className="text-center text-muted-foreground">
          <p>Failed to load repository data</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { repository, recentCommits, recentPullRequests, recentIssues, releases, metricsCounts } = data

  const metrics = [
    {
      title: 'Open Issues',
      value: formatNumber(repository.open_issues_count),
      icon: AlertCircle,
      color: 'text-orange-500',
      subtitle: 'Current open issues'
    },
    {
      title: 'Commits (30d)',
      value: formatNumber(metricsCounts.commits.last30Days),
      icon: GitCommit,
      color: 'text-green-500',
      subtitle: `${metricsCounts.commits.last7Days} in last 7 days`
    },
    {
      title: 'Open PRs',
      value: formatNumber(metricsCounts.pullRequests.open),
      icon: GitPullRequest,
      color: 'text-blue-500',
      subtitle: `${metricsCounts.pullRequests.closed} closed total`
    },
    {
      title: 'Total Releases',
      value: formatNumber(metricsCounts.totalReleases),
      icon: Tag,
      color: 'text-purple-500',
      subtitle: 'All-time releases'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Repository Metrics */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-heading font-semibold mb-4">Repository Metrics</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.title} className="text-center">
                <Icon className={`h-6 w-6 mx-auto mb-2 ${metric.color}`} />
                <div className="font-semibold text-lg">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.title}</div>
                {metric.subtitle && (
                  <div className="text-xs text-muted-foreground mt-1">{metric.subtitle}</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Repository Info */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Language</span>
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getLanguageColor(repository.language || '') }}
              />
              <span className="text-sm font-medium">{repository.language || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Size</span>
            <span className="text-sm font-medium">{formatNumber(repository.size)} KB</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm font-medium">{formatRelativeTime(repository.created_at)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm font-medium">{formatRelativeTime(repository.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-heading font-semibold mb-4">Recent Activity</h3>
        
        <div className="space-y-4">
          {/* Recent Commits */}
          {recentCommits.slice(0, 3).map((commit) => (
            <div key={commit.sha} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <GitCommit className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Link
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-primary transition-colors line-clamp-2"
                >
                  {commit.commit.message.split('\n')[0]}
                </Link>
                <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                  <span>{commit.commit.author.name}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(commit.commit.author.date)}</span>
                </div>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </div>
          ))}

          {/* Recent Pull Requests */}
          {recentPullRequests.slice(0, 2).map((pr) => (
            <div key={pr.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <GitPullRequest className={`h-4 w-4 mt-1 flex-shrink-0 ${
                pr.state === 'open' ? 'text-green-500' : pr.merged ? 'text-purple-500' : 'text-red-500'
              }`} />
              <div className="flex-1 min-w-0">
                <Link
                  href={pr.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-primary transition-colors line-clamp-2"
                >
                  {pr.title}
                </Link>
                <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                  <span>#{pr.number}</span>
                  <span>•</span>
                  <span>{pr.user.login}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(pr.created_at)}</span>
                </div>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>

        {recentCommits.length === 0 && recentPullRequests.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  )
}