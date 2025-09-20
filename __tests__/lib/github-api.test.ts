import { GitHubAPI } from '@/lib/github-api'

// Mock fetch globally
global.fetch = jest.fn()

// Mock environment variables
const originalEnv = process.env
beforeAll(() => {
  process.env = { ...originalEnv, GITHUB_TOKEN: 'test-token' }
})

afterAll(() => {
  process.env = originalEnv
})

describe('GitHubAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getRepository', () => {
    it('should fetch repository information', async () => {
      const mockRepo = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        stargazers_count: 100,
        forks_count: 50,
        open_issues_count: 10
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepo)
      })

      const result = await GitHubAPI.getRepository('owner', 'test-repo')

      expect(result).toEqual(mockRepo)
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/test-repo',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token test-token'
          })
        })
      )
    })

    it('should handle API errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not Found' })
      })

      await expect(GitHubAPI.getRepository('owner', 'nonexistent')).rejects.toThrow('Not Found')
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(GitHubAPI.getRepository('owner', 'repo')).rejects.toThrow('Network error')
    })
  })

  describe('getAllRepositoryContributors', () => {
    it('should fetch all contributors across multiple pages', async () => {
      const mockPage1 = Array.from({ length: 100 }, (_, i) => ({ 
        id: i + 1, 
        login: `user${i + 1}`,
        contributions: 10 - i
      }))
      const mockPage2 = Array.from({ length: 30 }, (_, i) => ({ 
        id: i + 101, 
        login: `user${i + 101}`,
        contributions: 5
      }))

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPage1)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPage2)
        })

      const result = await GitHubAPI.getAllRepositoryContributors('owner', 'repo')

      expect(result).toHaveLength(130)
      expect(result[0].login).toBe('user1')
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should stop at max pages limit', async () => {
      const mockPage = Array.from({ length: 100 }, (_, i) => ({ 
        id: i + 1, 
        login: `user${i + 1}`,
        contributions: 10
      }))

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPage)
      })

      const result = await GitHubAPI.getAllRepositoryContributors('owner', 'repo', 2)

      expect(result).toHaveLength(200) // 2 pages * 100 items
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('getContributorDetails', () => {
    it('should fetch detailed information for contributors', async () => {
      const mockContributors = [
        { id: 1, login: 'user1', contributions: 10 },
        { id: 2, login: 'user2', contributions: 5 }
      ]

      const mockUserDetails = [
        { login: 'user1', name: 'User One', company: 'Company A', location: 'City A' },
        { login: 'user2', name: 'User Two', company: 'Company B', location: 'City B' }
      ]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserDetails[0])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserDetails[1])
        })

      const result = await GitHubAPI.getContributorDetails(mockContributors as any)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 1,
        login: 'user1',
        contributions: 10,
        name: 'User One',
        company: 'Company A',
        location: 'City A'
      })
    })

    it('should handle failed user detail requests gracefully', async () => {
      const mockContributors = [
        { id: 1, login: 'user1', contributions: 10 },
        { id: 2, login: 'user2', contributions: 5 }
      ]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ login: 'user1', name: 'User One' })
        })
        .mockRejectedValueOnce(new Error('User not found'))

      const result = await GitHubAPI.getContributorDetails(mockContributors as any)

      expect(result).toHaveLength(2) // Both contributors should be returned, one with details, one without
      expect(result[0].login).toBe('user1')
      expect(result[0].name).toBe('User One')
      expect(result[1].login).toBe('user2')
      expect(result[1].name).toBeUndefined() // Failed request returns original contributor
    })
  })

  describe('getPullRequestCounts', () => {
    it('should return correct PR counts', async () => {
      const mockOpenResponse = { total_count: 25 }
      const mockClosedResponse = { total_count: 150 }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOpenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockClosedResponse)
        })

      const result = await GitHubAPI.getPullRequestCounts('owner', 'repo')

      expect(result).toEqual({
        open: 25,
        closed: 150,
        total: 175
      })

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search/issues'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json'
          })
        })
      )
    })

    it('should handle API errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

      const result = await GitHubAPI.getPullRequestCounts('owner', 'repo')

      expect(result).toEqual({
        open: 0,
        closed: 0,
        total: 0
      })
    })

    it('should handle missing total_count in response', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}) // Missing total_count
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}) // Missing total_count
        })

      const result = await GitHubAPI.getPullRequestCounts('owner', 'repo')

      expect(result).toEqual({
        open: 0,
        closed: 0,
        total: 0
      })
    })
  })

  describe('getCommitCounts', () => {
    it('should return commit counts for different time periods', async () => {
      const mockCommits24h = [{ sha: '1' }, { sha: '2' }]
      const mockCommits7d = [{ sha: '1' }, { sha: '2' }, { sha: '3' }]
      const mockCommits30d = [{ sha: '1' }, { sha: '2' }, { sha: '3' }, { sha: '4' }]
      const mockCommitsAll = [{ sha: '1' }, { sha: '2' }, { sha: '3' }, { sha: '4' }, { sha: '5' }]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCommits24h)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCommits7d)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCommits30d)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCommitsAll)
        })

      const result = await GitHubAPI.getCommitCounts('owner', 'repo')

      expect(result).toEqual({
        last24Hours: 2,
        last7Days: 3,
        last30Days: 4,
        allTime: 5
      })

      expect(fetch).toHaveBeenCalledTimes(4)
    })

    it('should handle API errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

      const result = await GitHubAPI.getCommitCounts('owner', 'repo')

      expect(result).toEqual({
        last24Hours: 0,
        last7Days: 0,
        last30Days: 0,
        allTime: 0
      })
    })

    it('should handle large commit counts correctly', async () => {
      const mockCommits = Array.from({ length: 100 }, (_, i) => ({ sha: `commit${i}` }))

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCommits)
      })

      const result = await GitHubAPI.getCommitCounts('owner', 'repo')

      expect(result.allTime).toBe(100)
    })
  })

  describe('getRepositoryPullRequests', () => {
    it('should fetch pull requests with correct parameters', async () => {
      const mockPRs = [
        { id: 1, number: 1, title: 'PR 1', state: 'open' },
        { id: 2, number: 2, title: 'PR 2', state: 'closed' }
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPRs)
      })

      const result = await GitHubAPI.getRepositoryPullRequests('owner', 'repo', 'all', 1, 30)

      expect(result).toEqual(mockPRs)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('pulls?state=all&page=1&per_page=30'),
        expect.any(Object)
      )
    })
  })

  describe('getRepositoryIssues', () => {
    it('should fetch issues with correct parameters', async () => {
      const mockIssues = [
        { id: 1, number: 1, title: 'Issue 1', state: 'open' },
        { id: 2, number: 2, title: 'Issue 2', state: 'closed' }
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssues)
      })

      const result = await GitHubAPI.getRepositoryIssues('owner', 'repo', 'open', 1, 30)

      expect(result).toEqual(mockIssues)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('issues?state=open&page=1&per_page=30'),
        expect.any(Object)
      )
    })
  })

  describe('getAllRepositoryReleases', () => {
    it('should fetch all releases across multiple pages', async () => {
      const mockPage1 = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, tag_name: `v${i + 1}` }))
      const mockPage2 = Array.from({ length: 50 }, (_, i) => ({ id: i + 101, tag_name: `v${i + 101}` }))

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPage1)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPage2)
        })

      const result = await GitHubAPI.getAllRepositoryReleases('owner', 'repo')

      expect(result).toHaveLength(150)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle empty response', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })

      const result = await GitHubAPI.getAllRepositoryReleases('owner', 'repo')

      expect(result).toEqual([])
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getNewContributorsFromLatestRelease', () => {
    it('should extract new contributors from release notes', async () => {
      const mockRelease = {
        tag_name: 'v1.0.0',
        body: `## What's Changed
* Feature A by @user1 in https://github.com/owner/repo/pull/1

## New Contributors
* @newuser1 made their first contribution in https://github.com/owner/repo/pull/2
* @newuser2 made their first contribution in https://github.com/owner/repo/pull/3

**Full Changelog**: https://github.com/owner/repo/compare/v0.9.0...v1.0.0`
      }

      const mockUserDetails = [
        { id: 1, login: 'newuser1', name: 'New User 1', type: 'User' },
        { id: 2, login: 'newuser2', name: 'New User 2', type: 'User' }
      ]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockRelease])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserDetails[0])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserDetails[1])
        })

      const result = await GitHubAPI.getNewContributorsFromLatestRelease('owner', 'repo')

      expect(result).toHaveLength(2)
      expect(result[0].login).toBe('newuser1')
      expect(result[1].login).toBe('newuser2')
    })

    it('should return empty array when no releases exist', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })

      const result = await GitHubAPI.getNewContributorsFromLatestRelease('owner', 'repo')

      expect(result).toEqual([])
    })

    it('should return empty array when no new contributors section exists', async () => {
      const mockRelease = {
        tag_name: 'v1.0.0',
        body: 'Just a regular release with no new contributors section'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockRelease])
      })

      const result = await GitHubAPI.getNewContributorsFromLatestRelease('owner', 'repo')

      expect(result).toEqual([])
    })
  })

  describe('error handling', () => {
    it('should handle rate limiting errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ 
          message: 'API rate limit exceeded',
          documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
        })
      })

      await expect(GitHubAPI.getRepository('owner', 'repo')).rejects.toThrow('API rate limit exceeded')
    })

    it('should handle malformed JSON responses', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      await expect(GitHubAPI.getRepository('owner', 'repo')).rejects.toThrow('GitHub API error: 500')
    })
  })

  describe('authentication', () => {
    it('should include authorization header when token is provided', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      await GitHubAPI.getRepository('owner', 'repo')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'token test-token'
          })
        })
      )
    })

    it('should work without token', async () => {
      // Create a new test environment without token
      jest.resetModules()
      delete process.env.GITHUB_TOKEN
      
      // Re-import the module to get fresh instance without token
      const { GitHubAPI: GitHubAPINoToken } = await import('@/lib/github-api')

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      await GitHubAPINoToken.getRepository('owner', 'repo')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      )

      // Restore token for other tests
      process.env.GITHUB_TOKEN = 'test-token'
    })
  })
})