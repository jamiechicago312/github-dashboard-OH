'use client'

import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Award, Users } from 'lucide-react'
import { DashboardData } from '@/types/github'
import { formatNumber } from '@/lib/utils'
import { LoadingCard } from './loading-card'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ContributorStats() {
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
        <h3 className="font-heading font-semibold mb-4 flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>External Contributors</span>
        </h3>
        <div className="text-center text-muted-foreground">
          <p>Failed to load contributor data</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { externalContributors } = data

  // Sort external contributors by contributions
  const topExternalContributors = externalContributors
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 10)

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold flex items-center space-x-2">
          <Award className="h-5 w-5 text-yellow-500" />
          <span>Top External Contributors</span>
        </h3>
        <div className="text-sm text-muted-foreground">
          {formatNumber(externalContributors.length)} total external contributors
        </div>
      </div>

      <div className="space-y-4">
        {topExternalContributors.map((contributor, index) => (
          <div
            key={contributor.id}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-6 text-center">
              <span className="text-sm font-medium text-muted-foreground">
                #{index + 1}
              </span>
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0">
              <Image
                src={contributor.avatar_url}
                alt={`${contributor.login}'s avatar`}
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <Link
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>{contributor.name || contributor.login}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>@{contributor.login}</span>
                {contributor.company && (
                  <>
                    <span>•</span>
                    <span>{contributor.company}</span>
                  </>
                )}
                {contributor.location && (
                  <>
                    <span>•</span>
                    <span>{contributor.location}</span>
                  </>
                )}
              </div>
            </div>

            {/* Contributions */}
            <div className="flex-shrink-0 text-right">
              <div className="font-semibold">
                {formatNumber(contributor.contributions)}
              </div>
              <div className="text-xs text-muted-foreground">
                contributions
              </div>
            </div>
          </div>
        ))}
      </div>

      {externalContributors.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No external contributors found</p>
        </div>
      )}
    </div>
  )
}