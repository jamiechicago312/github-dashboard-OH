import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  
  if (!token) {
    return NextResponse.json({
      error: 'GitHub token not configured',
      message: 'Please add your GITHUB_TOKEN to environment variables',
      hasToken: false,
    })
  }

  try {
    // Test API call to verify token works
    const response = await fetch('https://api.github.com/repos/All-Hands-AI/OpenHands', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'OpenHands-Dashboard/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json({
        error: 'GitHub API error',
        status: response.status,
        message: response.statusText,
        hasToken: true,
      })
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      hasToken: true,
      repository: {
        name: data.name,
        stars: data.stargazers_count,
        forks: data.forks_count,
      },
      rateLimit: {
        remaining: response.headers.get('X-RateLimit-Remaining'),
        reset: response.headers.get('X-RateLimit-Reset'),
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Network error',
      message: error instanceof Error ? error.message : 'Unknown error',
      hasToken: true,
    })
  }
}