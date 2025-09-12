import { GitHubAPI } from '@/lib/github-api'

// Mock fetch globally
global.fetch = jest.fn()

describe('GitHubAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
})