export interface GitHubUser {
  id: number
  login: string
  avatar_url: string
  html_url: string
  name?: string
  company?: string
  location?: string
  email?: string
  bio?: string
  public_repos: number
  followers: number
  following: number
  created_at: string
  type: 'User' | 'Organization'
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description?: string
  html_url: string
  clone_url: string
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  language?: string
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  default_branch: string
  topics: string[]
  license?: {
    key: string
    name: string
  }
  owner: GitHubUser
}

export interface GitHubContributor {
  id: number
  login: string
  avatar_url: string
  html_url: string
  contributions: number
  type: 'User' | 'Bot'
  name?: string
  company?: string
  location?: string
  isExternal?: boolean
}

export interface GitHubCommit {
  sha: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
    message: string
  }
  author?: GitHubUser
  committer?: GitHubUser
  html_url: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  merged: boolean
  html_url: string
  created_at: string
  updated_at: string
  closed_at?: string
  merged_at?: string
  user: GitHubUser
  assignees: GitHubUser[]
  labels: Array<{
    id: number
    name: string
    color: string
  }>
  additions: number
  deletions: number
  changed_files: number
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  html_url: string
  created_at: string
  updated_at: string
  closed_at?: string
  user: GitHubUser
  assignees: GitHubUser[]
  labels: Array<{
    id: number
    name: string
    color: string
  }>
  comments: number
}

export interface GitHubRelease {
  id: number
  tag_name: string
  name?: string
  body?: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at?: string
  html_url: string
  author: GitHubUser
  assets: Array<{
    id: number
    name: string
    download_count: number
    size: number
  }>
}

export interface ContributionStats {
  total: number
  weeks: Array<{
    week: number
    additions: number
    deletions: number
    commits: number
  }>
}

export interface RepositoryStats {
  contributors: number
  commits: number
  branches: number
  releases: number
  issues: {
    open: number
    closed: number
    total: number
  }
  pullRequests: {
    open: number
    closed: number
    merged: number
    total: number
  }
}

export interface OrganizationStats {
  repositories: GitHubRepository[]
  totalStars: number
  totalForks: number
  totalContributors: number
  topLanguages: Array<{
    language: string
    count: number
    percentage: number
  }>
}

export interface DashboardData {
  repository: GitHubRepository
  organization: GitHubUser
  contributors: GitHubContributor[]
  externalContributors: GitHubContributor[]
  recentCommits: GitHubCommit[]
  recentPullRequests: GitHubPullRequest[]
  recentIssues: GitHubIssue[]
  releases: GitHubRelease[]
  stats: RepositoryStats
  orgStats: OrganizationStats
  contributionStats: ContributionStats
}