'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Star, GitFork, Users, Activity, Bot, UserPlus, ExternalLink } from 'lucide-react'
import { DashboardData } from '@/types/github'
import { formatNumber } from '@/lib/utils'
import { LoadingSpinner } from './loading-card'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DashboardOverview() {
  const { data, error, isLoading } = useSWR<DashboardData & { _cache?: any }>('/api/github/dashboard', fetcher, {
    refreshInterval: 0, // Disable automatic refresh - we'll handle it manually
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // Dedupe requests within 5 minutes
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-center h-20">
              <LoadingSpinner />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-destructive/10 text-destructive p-6 text-center">
        <p className="font-medium">Failed to load dashboard data</p>
        <p className="text-sm mt-1">Please try refreshing the page</p>
      </div>
    )
  }

  if (!data) return null

  const {
    repository,
    contributors,
    externalContributors,
    firstTimeContributors,
    firstTimeContributorsCount,
    agentContributors,
    totalAgentContributions,
    orgStats
  } = data

  const stats = [
    {
      title: 'Stars',
      value: formatNumber(repository.stargazers_count),
      icon: Star,
      description: 'GitHub stars',
    },
    {
      title: 'Forks',
      value: formatNumber(repository.forks_count),
      icon: GitFork,
      description: 'Repository forks',
    },
    {
      title: 'Contributors',
      value: formatNumber(contributors.length),
      icon: Users,
      description: 'Total contributors',
    },
    {
      title: 'External Contributors',
      value: formatNumber(externalContributors.length),
      icon: Activity,
      description: 'Non-org contributors',
    },
    {
      title: 'OpenHands Agent',
      value: formatNumber(totalAgentContributions),
      icon: Bot,
      description: 'Autonomous contributions',
      highlight: true,
    },
    {
      title: 'First-Time Contributors',
      value: formatNumber(firstTimeContributorsCount),
      icon: UserPlus,
      description: 'New contributors to last release',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Repository Info */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading">{repository.full_name}</h2>
        {repository.description && (
          <p className="text-muted-foreground">{repository.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isHighlight = stat.highlight
          return (
            <div
              key={stat.title}
              className={`rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow ${
                isHighlight 
                  ? 'bg-primary/5 border-primary/20 text-card-foreground' 
                  : 'bg-card text-card-foreground'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className={`h-5 w-5 ${isHighlight ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="font-heading font-medium">{stat.title}</h3>
              </div>
              <div className="mt-2">
                <p className={`text-2xl font-bold ${isHighlight ? 'text-primary' : ''}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* First-Time Contributors */}
      {firstTimeContributors.length > 0 && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="h-5 w-5 text-green-500" />
            <h3 className="font-heading font-semibold">Recent First-Time Contributors</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {firstTimeContributors.slice(0, 20).map((contributor) => (
              <Link
                key={contributor.id}
                href={contributor.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
              >
                <img
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {contributor.name || contributor.login}
                    </p>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground">@{contributor.login}</p>
                </div>
              </Link>
            ))}
          </div>
          {firstTimeContributors.length > 20 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              And {firstTimeContributors.length - 20} more first-time contributors...
            </p>
          )}
          {firstTimeContributors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent first-time contributors found.
            </p>
          )}
        </div>
      )}

      {/* OpenHands Agent Contributions */}
      {agentContributors.length > 0 && (
        <div className="rounded-lg border bg-primary/5 border-primary/20 text-card-foreground shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-semibold">OpenHands Autonomous Agent</h3>
          </div>
          <div className="space-y-3">
            {agentContributors.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <div className="flex items-center space-x-3">
                  <img
                    src={agent.avatar_url}
                    alt={agent.login}
                    className="w-10 h-10 rounded-full border-2 border-primary/20"
                  />
                  <div>
                    <p className="font-medium">@{agent.login}</p>
                    <p className="text-sm text-muted-foreground">Autonomous AI Agent</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatNumber(agent.contributions)}</p>
                  <p className="text-xs text-muted-foreground">contributions</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-primary/10">
            <p className="text-sm text-center">
              <span className="font-semibold text-primary">{formatNumber(totalAgentContributions)} total contributions</span>
              {' '}by OpenHands autonomous agents - showcasing AI-powered development! 🤖✨
            </p>
          </div>
        </div>
      )}

      {/* Organization Stats */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-heading font-semibold mb-4">All-Hands-AI Organization</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{formatNumber(orgStats.repositories.length)}</p>
            <p className="text-sm text-muted-foreground">Repositories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatNumber(orgStats.totalStars)}</p>
            <p className="text-sm text-muted-foreground">Total Stars</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatNumber(orgStats.totalForks)}</p>
            <p className="text-sm text-muted-foreground">Total Forks</p>
          </div>
        </div>
      </div>
    </div>
  )
}