import { NextResponse } from 'next/server'
import { GitHubAPI } from '@/lib/github-api'
import { DashboardData } from '@/types/github'
import { isExternalContributor } from '@/lib/utils'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'

const OWNER = 'All-Hands-AI'
const REPO = 'OpenHands'
const ORG = 'All-Hands-AI'

// Helper function to get cached data or fetch fresh data
async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlMinutes: number
): Promise<T> {
  const cached = cache.get<T>(cacheKey)
  if (cached) {
    console.log(`Cache hit for ${cacheKey}`)
    return cached
  }
  
  console.log(`Cache miss for ${cacheKey}, fetching...`)
  const data = await fetchFn()
  cache.set(cacheKey, data, ttlMinutes)
  return data
}

export async function GET() {
  try {
    console.log('Fetching dashboard data...')

    // Check if we have cached dashboard data
    const dashboardCacheKey = CacheKeys.dashboardData(OWNER, REPO, ORG)
    const cachedDashboard = cache.get<DashboardData>(dashboardCacheKey)
    
    if (cachedDashboard) {
      console.log('Returning cached dashboard data')
      return NextResponse.json(cachedDashboard)
    }

    console.log('Cache miss, fetching fresh data...')

    // Fetch basic repository and organization info with caching
    const [repository, organization] = await Promise.all([
      getCachedOrFetch(
        CacheKeys.repository(OWNER, REPO),
        () => GitHubAPI.getRepository(OWNER, REPO),
        CacheTTL.repository
      ),
      getCachedOrFetch(
        CacheKeys.organization(ORG),
        () => GitHubAPI.getOrganization(ORG),
        CacheTTL.organization
      ),
    ])

    console.log('Fetched basic info, getting contributors...')

    // Fetch contributors and organization members with caching
    const [contributors, orgMembers] = await Promise.all([
      getCachedOrFetch(
        CacheKeys.contributors(OWNER, REPO),
        () => GitHubAPI.getAllRepositoryContributors(OWNER, REPO),
        CacheTTL.contributors
      ),
      getCachedOrFetch(
        CacheKeys.orgMembers(ORG),
        () => GitHubAPI.getAllOrganizationMembers(ORG),
        CacheTTL.orgMembers
      ),
    ])

    console.log(`Found ${contributors.length} contributors, ${orgMembers.length} org members`)

    // Identify external contributors
    const orgMemberLogins = orgMembers.map(member => member.login.toLowerCase())
    const externalContributors = contributors.filter(contributor => 
      isExternalContributor(contributor, orgMemberLogins)
    )

    console.log(`Found ${externalContributors.length} external contributors`)

    // Get detailed contributor information for top external contributors
    const topExternalContributors = externalContributors
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 20)

    const detailedExternalContributors = await GitHubAPI.getContributorDetails(topExternalContributors)

    // Mark external contributors
    const allContributorsWithFlags = contributors.map(contributor => ({
      ...contributor,
      isExternal: isExternalContributor(contributor, orgMemberLogins),
    }))

    console.log('Fetching recent activity...')

    // Fetch recent activity (last 30 days) with caching
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [recentCommits, recentPullRequests, recentIssues, releases] = await Promise.all([
      getCachedOrFetch(
        CacheKeys.recentCommits(OWNER, REPO),
        () => GitHubAPI.getRepositoryCommits(OWNER, REPO, thirtyDaysAgo.toISOString(), 1, 20),
        CacheTTL.recentActivity
      ),
      getCachedOrFetch(
        CacheKeys.recentPRs(OWNER, REPO),
        () => GitHubAPI.getRepositoryPullRequests(OWNER, REPO, 'all', 1, 20),
        CacheTTL.recentActivity
      ),
      getCachedOrFetch(
        CacheKeys.recentIssues(OWNER, REPO),
        () => GitHubAPI.getRepositoryIssues(OWNER, REPO, 'all', 1, 20),
        CacheTTL.recentActivity
      ),
      getCachedOrFetch(
        CacheKeys.releases(OWNER, REPO),
        () => GitHubAPI.getRepositoryReleases(OWNER, REPO, 1, 10),
        CacheTTL.releases
      ),
    ])

    console.log('Calculating statistics...')

    // Calculate statistics with caching
    const [stats, orgStats] = await Promise.all([
      getCachedOrFetch(
        CacheKeys.repoStats(OWNER, REPO),
        () => GitHubAPI.calculateRepositoryStats(OWNER, REPO),
        CacheTTL.stats
      ),
      getCachedOrFetch(
        CacheKeys.orgStats(ORG),
        () => GitHubAPI.calculateOrganizationStats(ORG),
        CacheTTL.stats
      ),
    ])

    // Mock contribution stats for now (GitHub's stats API can be slow/unreliable)
    const contributionStats = {
      total: contributors.reduce((sum, c) => sum + c.contributions, 0),
      weeks: [], // Would need to implement proper stats fetching
    }

    const dashboardData: DashboardData = {
      repository,
      organization,
      contributors: allContributorsWithFlags,
      externalContributors: detailedExternalContributors,
      recentCommits,
      recentPullRequests,
      recentIssues,
      releases,
      stats,
      orgStats,
      contributionStats,
    }

    console.log('Dashboard data prepared successfully')

    // Cache the complete dashboard data
    cache.set(dashboardCacheKey, dashboardData, CacheTTL.dashboardData)

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}