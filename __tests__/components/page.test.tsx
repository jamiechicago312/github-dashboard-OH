import React from 'react'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

// Mock the components to avoid complex dependencies
jest.mock('@/components/dashboard-overview', () => ({
  DashboardOverview: () => <div data-testid="dashboard-overview">Dashboard Overview</div>
}))

jest.mock('@/components/contributor-stats', () => ({
  ContributorStats: () => <div data-testid="contributor-stats">Contributor Stats</div>
}))

jest.mock('@/components/enhanced-repository-metrics', () => ({
  __esModule: true,
  default: () => <div data-testid="enhanced-repository-metrics">Enhanced Repository Metrics</div>
}))

jest.mock('@/components/all-time-trends-chart', () => ({
  __esModule: true,
  default: () => <div data-testid="all-time-trends-chart">All Time Trends Chart</div>
}))

jest.mock('@/components/activity-chart', () => ({
  ActivityChart: () => <div data-testid="activity-chart">Activity Chart</div>
}))

jest.mock('@/components/loading-card', () => ({
  LoadingCard: () => <div data-testid="loading-card">Loading...</div>
}))

describe('HomePage', () => {
  it('should render the main page components', () => {
    render(<HomePage />)
    
    // Check that main components are present
    expect(screen.getByText('OpenHands Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Analytics and insights for the OpenHands repository')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()
    expect(screen.getByTestId('enhanced-repository-metrics')).toBeInTheDocument()
    expect(screen.getByTestId('contributor-stats')).toBeInTheDocument()
    expect(screen.getByTestId('all-time-trends-chart')).toBeInTheDocument()
  })

  it('should NOT render the activity overview section', () => {
    render(<HomePage />)
    
    // Verify that the ActivityChart component is NOT rendered
    expect(screen.queryByTestId('activity-chart')).not.toBeInTheDocument()
    
    // Also check that "Activity Overview" text is not present
    expect(screen.queryByText('Activity Overview')).not.toBeInTheDocument()
  })
})