import {
  GitHubUser,
  GitHubRepository,
  GitHubContributor,
  GitHubCommit,
  GitHubPullRequest,
  GitHubIssue,
  GitHubRelease,
  RepositoryStats,
  OrganizationStats,
} from '@/types/github'

const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

interface GitHubAPIOptions {
  page?: number
  per_page?: number
  since?: string
  until?: string
  state?: 'open' | 'closed' | 'all'
  sort?: string
  direction?: 'asc' | 'desc'
  q?: string
  order?: 'asc' | 'desc'
}

class GitHubAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'GitHubAPIError'
  }
}

async function fetchGitHub(endpoint: string, options: GitHubAPIOptions = {}): Promise<any> {
  const url = new URL(`${GITHUB_API_BASE}${endpoint}`)
  
  // Add query parameters
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, value.toString())
    }
  })

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Dashboard-OpenHands',
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`
  }

  try {
    const response = await fetch(url.toString(), { headers })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new GitHubAPIError(
        errorData.message || `GitHub API error: ${response.status}`,
        response.status
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error
    }
    throw new GitHubAPIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function fetchAllPages<T>(
  endpoint: string,
  options: GitHubAPIOptions = {},
  maxPages = 10
): Promise<T[]> {
  const results: T[] = []
  let page = 1
  const perPage = options.per_page || 100

  while (page <= maxPages) {
    const data = await fetchGitHub(endpoint, { ...options, page, per_page: perPage })
    
    if (!Array.isArray(data) || data.length === 0) {
      break
    }

    results.push(...data)
    
    if (data.length < perPage) {
      break
    }
    
    page++
  }

  return results
}

export class GitHubAPI {
  /**
   * Get repository information
   */
  static async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return fetchGitHub(`/repos/${owner}/${repo}`)
  }

  /**
   * Get organization information
   */
  static async getOrganization(org: string): Promise<GitHubUser> {
    return fetchGitHub(`/orgs/${org}`)
  }

  /**
   * Get all repository contributors
   */
  static async getAllRepositoryContributors(
    owner: string,
    repo: string,
    maxPages = 10
  ): Promise<GitHubContributor[]> {
    return fetchAllPages<GitHubContributor>(`/repos/${owner}/${repo}/contributors`, {}, maxPages)
  }

  /**
   * Get all organization members
   */
  static async getAllOrganizationMembers(
    org: string,
    maxPages = 10
  ): Promise<GitHubUser[]> {
    return fetchAllPages<GitHubUser>(`/orgs/${org}/members`, {}, maxPages)
  }

  /**
   * Get detailed information for contributors
   */
  static async getContributorDetails(contributors: GitHubContributor[]): Promise<GitHubContributor[]> {
    const detailedContributors = await Promise.allSettled(
      contributors.map(async (contributor) => {
        try {
          const userDetails = await fetchGitHub(`/users/${contributor.login}`)
          return {
            ...contributor,
            name: userDetails.name,
            company: userDetails.company,
            location: userDetails.location,
          }
        } catch (error) {
          console.warn(`Failed to fetch details for ${contributor.login}:`, error)
          return contributor
        }
      })
    )

    return detailedContributors
      .filter((result): result is PromiseFulfilledResult<GitHubContributor> => result.status === 'fulfilled')
      .map(result => result.value)
  }

  /**
   * Get repository commits
   */
  static async getRepositoryCommits(
    owner: string,
    repo: string,
    since?: string,
    page = 1,
    perPage = 30
  ): Promise<GitHubCommit[]> {
    const options: GitHubAPIOptions = { page, per_page: perPage }
    if (since) {
      options.since = since
    }
    
    return fetchGitHub(`/repos/${owner}/${repo}/commits`, options)
  }

  /**
   * Get repository pull requests
   */
  static async getRepositoryPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all',
    page = 1,
    perPage = 30
  ): Promise<GitHubPullRequest[]> {
    return fetchGitHub(`/repos/${owner}/${repo}/pulls`, {
      state,
      page,
      per_page: perPage,
      sort: 'updated',
      direction: 'desc'
    })
  }

  /**
   * Get repository issues
   */
  static async getRepositoryIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all',
    page = 1,
    perPage = 30
  ): Promise<GitHubIssue[]> {
    return fetchGitHub(`/repos/${owner}/${repo}/issues`, {
      state,
      page,
      per_page: perPage,
      sort: 'updated',
      direction: 'desc'
    })
  }

  /**
   * Get repository releases
   */
  static async getRepositoryReleases(
    owner: string,
    repo: string,
    page = 1,
    perPage = 10
  ): Promise<GitHubRelease[]> {
    return fetchGitHub(`/repos/${owner}/${repo}/releases`, {
      page,
      per_page: perPage
    })
  }

  /**
   * Get the most recent first-time contributors chronologically
   * This identifies contributors with exactly 1 contribution and sorts them by most recent activity
   */
  static async getRecentFirstTimeContributors(
    owner: string,
    repo: string,
    limit = 20
  ): Promise<GitHubContributor[]> {
    try {
      console.log('Getting recent first-time contributors...')
      
      // Get all contributors
      const allContributors = await this.getAllRepositoryContributors(owner, repo, 20)
      
      // Filter to only first-time contributors (exactly 1 contribution)
      const firstTimeContributors = allContributors.filter(contributor => contributor.contributions === 1)
      
      console.log(`Found ${firstTimeContributors.length} first-time contributors`)
      
      if (firstTimeContributors.length === 0) {
        return []
      }

      // Get recent commits to find the most recent activity for each first-time contributor
      const recentCommits = await this.getRepositoryCommits(owner, repo, undefined, 1, 100) // Get last 100 commits
      
      // Create a map of contributor login to their most recent commit date
      const contributorLastCommitMap = new Map<string, string>()
      
      for (const commit of recentCommits) {
        const authorLogin = commit.author?.login
        if (authorLogin && !contributorLastCommitMap.has(authorLogin)) {
          contributorLastCommitMap.set(authorLogin, commit.commit.author.date)
        }
      }
      
      // Add commit dates to first-time contributors and sort by most recent
      const contributorsWithDates = firstTimeContributors
        .map(contributor => ({
          ...contributor,
          lastCommitDate: contributorLastCommitMap.get(contributor.login) || '1970-01-01T00:00:00Z'
        }))
        .sort((a, b) => new Date(b.lastCommitDate).getTime() - new Date(a.lastCommitDate).getTime())
        .slice(0, limit)
      
      // Remove the temporary lastCommitDate property
      const result = contributorsWithDates.map(({ lastCommitDate, ...contributor }) => contributor)
      
      console.log(`Returning ${result.length} most recent first-time contributors`)
      
      return result
    } catch (error) {
      console.error('Error getting recent first-time contributors:', error)
      return []
    }
  }

  /**
   * Calculate repository statistics
   */
  static async calculateRepositoryStats(owner: string, repo: string): Promise<RepositoryStats> {
    try {
      const [
        contributors,
        branches,
        releases,
        openIssues,
        closedIssues,
        openPRs,
        closedPRs
      ] = await Promise.allSettled([
        this.getAllRepositoryContributors(owner, repo, 5),
        fetchGitHub(`/repos/${owner}/${repo}/branches`, { per_page: 100 }),
        this.getRepositoryReleases(owner, repo, 1, 100),
        fetchGitHub(`/repos/${owner}/${repo}/issues`, { state: 'open', per_page: 1 }),
        fetchGitHub(`/repos/${owner}/${repo}/issues`, { state: 'closed', per_page: 1 }),
        fetchGitHub(`/repos/${owner}/${repo}/pulls`, { state: 'open', per_page: 1 }),
        fetchGitHub(`/repos/${owner}/${repo}/pulls`, { state: 'closed', per_page: 1 })
      ])

      // Get counts from headers or fallback to array length
      const getCount = (result: PromiseSettledResult<any>, fallback = 0): number => {
        if (result.status === 'fulfilled') {
          return Array.isArray(result.value) ? result.value.length : fallback
        }
        return fallback
      }

      return {
        contributors: getCount(contributors),
        commits: 0, // Would need separate API call to get accurate count
        branches: getCount(branches),
        releases: getCount(releases),
        issues: {
          open: getCount(openIssues),
          closed: getCount(closedIssues),
          total: getCount(openIssues) + getCount(closedIssues)
        },
        pullRequests: {
          open: getCount(openPRs),
          closed: getCount(closedPRs),
          merged: 0, // Would need to filter closed PRs for merged ones
          total: getCount(openPRs) + getCount(closedPRs)
        }
      }
    } catch (error) {
      console.error('Error calculating repository stats:', error)
      return {
        contributors: 0,
        commits: 0,
        branches: 0,
        releases: 0,
        issues: { open: 0, closed: 0, total: 0 },
        pullRequests: { open: 0, closed: 0, merged: 0, total: 0 }
      }
    }
  }

  /**
   * Calculate organization statistics
   */
  static async calculateOrganizationStats(org: string): Promise<OrganizationStats> {
    try {
      const repositories = await fetchAllPages<GitHubRepository>(`/orgs/${org}/repos`, { per_page: 100 }, 5)
      
      const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)
      const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0)
      
      // Count languages
      const languageCounts: Record<string, number> = {}
      repositories.forEach(repo => {
        if (repo.language) {
          languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
        }
      })

      const totalRepos = repositories.length
      const topLanguages = Object.entries(languageCounts)
        .map(([language, count]) => ({
          language,
          count,
          percentage: Math.round((count / totalRepos) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      return {
        repositories,
        totalStars,
        totalForks,
        totalContributors: 0, // Would need to aggregate from all repos
        topLanguages
      }
    } catch (error) {
      console.error('Error calculating organization stats:', error)
      return {
        repositories: [],
        totalStars: 0,
        totalForks: 0,
        totalContributors: 0,
        topLanguages: []
      }
    }
  }

  /**
   * Get user information
   */
  static async getUser(username: string): Promise<GitHubUser> {
    return fetchGitHub(`/users/${username}`)
  }

  /**
   * Search repositories
   */
  static async searchRepositories(query: string, page = 1, perPage = 30): Promise<{
    total_count: number
    items: GitHubRepository[]
  }> {
    return fetchGitHub('/search/repositories', {
      q: query,
      page,
      per_page: perPage,
      sort: 'stars',
      order: 'desc'
    })
  }

  /**
   * Get rate limit information
   */
  static async getRateLimit(): Promise<{
    rate: {
      limit: number
      remaining: number
      reset: number
    }
  }> {
    return fetchGitHub('/rate_limit')
  }
}