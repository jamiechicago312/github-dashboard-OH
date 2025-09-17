import { NextResponse } from 'next/server'
import { GitHubAPI } from '@/lib/github-api'
import { DashboardData } from '@/types/github'
import { isCommunityContributor } from '@/lib/utils'
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

    // Identify top contributors (excluding All-Hands-AI members)
    const orgMemberLogins = orgMembers.map(member => member.login.toLowerCase())
    const topContributors = contributors
      .filter(contributor => isCommunityContributor(contributor, orgMemberLogins))
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 20)

    console.log(`Found ${topContributors.length} top contributors`)

    // Track OpenHands agent contributions
    const openHandsAgents = ['openhands', 'openhands-agent', 'openhands-ai']
    const agentContributors = contributors.filter(contributor => 
      openHandsAgents.includes(contributor.login.toLowerCase())
    )
    const totalAgentContributions = agentContributors.reduce((sum, contributor) => sum + contributor.contributions, 0)

    console.log(`Found ${agentContributors.length} OpenHands agent contributors with ${totalAgentContributions} total contributions`)

    // Get new contributors from latest release (for the count)
    const newContributorsFromRelease = await GitHubAPI.getNewContributorsFromLatestRelease(OWNER, REPO)
    
    // Get the most recent 20 first-time contributors chronologically (for display)
    const recentFirstTimeContributors = await GitHubAPI.getRecentFirstTimeContributors(OWNER, REPO, 20)

    console.log(`Found ${newContributorsFromRelease.length} new contributors from latest release`)
    console.log(`Found ${recentFirstTimeContributors.length} recent first-time contributors`)

    // Get detailed contributor information for community contributors (prioritizing main branch approach)
    const detailedCommunityContributors = await GitHubAPI.getContributorDetails(topContributors)

    // Mark community contributors
    const allContributorsWithFlags = contributors.map(contributor => ({
      ...contributor,
      isCommunity: isCommunityContributor(contributor, orgMemberLogins),
      isAgent: openHandsAgents.includes(contributor.login.toLowerCase()),
    }))

    console.log('Fetching recent activity...')

    // Fetch recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [recentCommits, recentPullRequests, recentIssues, releases, commitCounts, prCounts, allReleases] = await Promise.all([
      GitHubAPI.getRepositoryCommits(OWNER, REPO, thirtyDaysAgo.toISOString(), 1, 20),
      GitHubAPI.getRepositoryPullRequests(OWNER, REPO, 'all', 1, 20),
      GitHubAPI.getRepositoryIssues(OWNER, REPO, 'all', 1, 20),
      GitHubAPI.getRepositoryReleases(OWNER, REPO, 1, 10),
      GitHubAPI.getCommitCounts(OWNER, REPO),
      GitHubAPI.getPullRequestCounts(OWNER, REPO),
      GitHubAPI.getAllRepositoryReleases(OWNER, REPO),
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
      communityContributors: detailedCommunityContributors,
      firstTimeContributors: recentFirstTimeContributors,
      firstTimeContributorsCount: newContributorsFromRelease.length, // Count from latest release
      agentContributors,
      totalAgentContributions,
      recentCommits,
      recentPullRequests,
      recentIssues,
      releases,
      stats,
      orgStats,
      contributionStats,
      metricsCounts: {
        commits: commitCounts,
        pullRequests: prCounts,
        totalReleases: allReleases.length,
      },
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