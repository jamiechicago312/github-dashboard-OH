import { NextResponse } from 'next/server'
import { GitHubAPI } from '@/lib/github-api'
import { DashboardData } from '@/types/github'
import { isExternalContributor } from '@/lib/utils'
import { SimpleCache } from '@/lib/simple-cache'

const OWNER = 'All-Hands-AI'
const REPO = 'OpenHands'
const ORG = 'All-Hands-AI'

export async function GET(request: Request) {
  try {
    console.log('Dashboard API called')

    // Check if we have cached data that's less than 1 hour old
    const cachedData = await SimpleCache.get<DashboardData>()
    
    if (cachedData) {
      console.log('Returning cached dashboard data')
      const status = await SimpleCache.getStatus()
      return NextResponse.json({
        ...cachedData,
        _cache: {
          cached: true,
          lastRefresh: status.lastRefresh,
          nextRefreshAvailable: status.nextRefreshAvailable
        }
      })
    }

    console.log('No valid cache found, fetching fresh data from GitHub...')

    // Fetch basic repository and organization info
    const [repository, organization] = await Promise.all([
      GitHubAPI.getRepository(OWNER, REPO),
      GitHubAPI.getOrganization(ORG),
    ])

    console.log('Fetched basic info, getting contributors...')

    // Fetch contributors and organization members
    const [contributors, orgMembers] = await Promise.all([
      GitHubAPI.getAllRepositoryContributors(OWNER, REPO),
      GitHubAPI.getAllOrganizationMembers(ORG),
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

    // Fetch recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [recentCommits, recentPullRequests, recentIssues, releases] = await Promise.all([
      GitHubAPI.getRepositoryCommits(OWNER, REPO, thirtyDaysAgo.toISOString(), 1, 20),
      GitHubAPI.getRepositoryPullRequests(OWNER, REPO, 'all', 1, 20),
      GitHubAPI.getRepositoryIssues(OWNER, REPO, 'all', 1, 20),
      GitHubAPI.getRepositoryReleases(OWNER, REPO, 1, 10),
    ])

    console.log('Calculating statistics...')

    // Calculate statistics
    const [stats, orgStats] = await Promise.all([
      GitHubAPI.calculateRepositoryStats(OWNER, REPO),
      GitHubAPI.calculateOrganizationStats(ORG),
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

    // Cache the complete dashboard data for 1 hour
    await SimpleCache.set(dashboardData)

    const status = await SimpleCache.getStatus()
    
    return NextResponse.json({
      ...dashboardData,
      _cache: {
        cached: false,
        lastRefresh: status.lastRefresh,
        nextRefreshAvailable: status.nextRefreshAvailable
      }
    })
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