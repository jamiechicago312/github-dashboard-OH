import { Suspense } from 'react'
import { DashboardOverview } from '@/components/dashboard-overview'
import { ContributorStats } from '@/components/contributor-stats'
import EnhancedRepositoryMetrics from '@/components/enhanced-repository-metrics'
import { ActivityChart } from '@/components/activity-chart'
import GranularActivityOverview from '@/components/granular-activity-overview'
import { LoadingCard } from '@/components/loading-card'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          OpenHands Dashboard
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Analytics and insights for the OpenHands repository and All-Hands-AI organization
        </p>
      </div>

      {/* Dashboard Overview */}
      <Suspense fallback={<LoadingCard />}>
        <DashboardOverview />
      </Suspense>

      {/* Enhanced Repository Metrics - Full Width */}
      <Suspense fallback={<LoadingCard />}>
        <EnhancedRepositoryMetrics stats={{
          contributors: 0,
          commits: 0,
          branches: 0,
          releases: 0,
          issues: { open: 0, closed: 0, total: 0 },
          pullRequests: { open: 0, closed: 0, merged: 0, total: 0 }
        }} />
      </Suspense>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 gap-8">
        {/* Contributor Stats */}
        <Suspense fallback={<LoadingCard />}>
          <ContributorStats />
        </Suspense>
      </div>

      {/* Granular Activity Overview */}
      <Suspense fallback={<LoadingCard />}>
        <GranularActivityOverview />
      </Suspense>

      {/* Activity Chart */}
      <Suspense fallback={<LoadingCard />}>
        <ActivityChart />
      </Suspense>
    </div>
  )
}