import { NextRequest, NextResponse } from 'next/server'
import { GitHubAPI } from '@/lib/github-api'
import { TimeBasedMetrics, TimeRangeOption } from '@/types/github'

const OWNER = 'All-Hands-AI'
const REPO = 'OpenHands'

// Define time range options
const TIME_RANGES: TimeRangeOption[] = [
  { label: 'All Time', value: 'all-time' },
  { label: '1 Year', value: '1-year', days: 365 },
  { label: '1 Month', value: '1-month', days: 30 },
  { label: '1 Week', value: '1-week', days: 7 },
  { label: '24 Hours', value: '24-hours', days: 1 },
]

function getDateRange(timeRange: string): { since?: string; until?: string } {
  const range = TIME_RANGES.find(r => r.value === timeRange)
  if (!range || !range.days) return {}

  const now = new Date()
  const since = new Date(now.getTime() - (range.days * 24 * 60 * 60 * 1000))
  
  return {
    since: since.toISOString(),
    until: now.toISOString()
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const timeRange = searchParams.get('range') || 'all-time'
    
    console.log(`Fetching metrics for time range: ${timeRange}`)

    const selectedRange = TIME_RANGES.find(r => r.value === timeRange)
    if (!selectedRange) {
      return NextResponse.json(
        { error: 'Invalid time range' },
        { status: 400 }
      )
    }

    const { since, until } = getDateRange(timeRange)
    
    // Fetch time-based data
    const [stats, commits, pullRequests, issues, releases] = await Promise.allSettled([
      GitHubAPI.calculateRepositoryStatsForRange(OWNER, REPO, since, until),
      since ? GitHubAPI.getRepositoryCommitsInRange(OWNER, REPO, since, until, 5) : [],
      since ? GitHubAPI.getRepositoryPullRequestsInRange(OWNER, REPO, 'all', since, until, 5) : [],
      since ? GitHubAPI.getRepositoryIssuesInRange(OWNER, REPO, 'all', since, until, 5) : [],
      since ? GitHubAPI.getRepositoryReleases(OWNER, REPO, 1, 20) : GitHubAPI.getRepositoryReleases(OWNER, REPO, 1, 20)
    ])

    const getResult = <T>(result: PromiseSettledResult<T>, fallback: T): T => {
      return result.status === 'fulfilled' ? result.value : fallback
    }

    const timeBasedMetrics: TimeBasedMetrics = {
      timeRange: selectedRange,
      stats: getResult(stats, {
        contributors: 0,
        commits: 0,
        branches: 0,
        releases: 0,
        issues: { open: 0, closed: 0, total: 0 },
        pullRequests: { open: 0, closed: 0, merged: 0, total: 0 }
      }),
      commits: getResult(commits, []),
      pullRequests: getResult(pullRequests, []),
      issues: getResult(issues, []),
      releases: getResult(releases, [])
    }

    console.log(`Successfully fetched metrics for ${timeRange}`)

    return NextResponse.json(timeBasedMetrics)
  } catch (error) {
    console.error('Error fetching time-based metrics:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch time-based metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}