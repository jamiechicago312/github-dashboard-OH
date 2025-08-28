'use client'

import useSWR from 'swr'
import { Star, GitFork, Users, Activity } from 'lucide-react'
import { DashboardData } from '@/types/github'
import { formatNumber } from '@/lib/utils'
import { LoadingSpinner } from './loading-card'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DashboardOverview() {
  const { data, error, isLoading } = useSWR<DashboardData>('/api/github/dashboard', fetcher, {
    refreshInterval: 900000, // Refresh every 15 minutes (reduced from 5 minutes)
    revalidateOnFocus: false,
    revalidateOnReconnect: false, // Don't refetch on network reconnect
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

  const { repository, contributors, externalContributors, orgStats } = data

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
  ]

  return (
    <div className="space-y-6">
      {/* Repository Info */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{repository.full_name}</h2>
        {repository.description && (
          <p className="text-muted-foreground">{repository.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">{stat.title}</h3>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Organization Stats */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-semibold mb-4">All-Hands-AI Organization</h3>
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