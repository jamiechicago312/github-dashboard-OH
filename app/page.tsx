import { Suspense } from 'react'
import { DashboardOverview } from '@/components/dashboard-overview'
import { ContributorStats } from '@/components/contributor-stats'
import { RepositoryMetrics } from '@/components/repository-metrics'
import { ActivityChart } from '@/components/activity-chart'
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Repository Metrics */}
        <Suspense fallback={<LoadingCard />}>
          <RepositoryMetrics />
        </Suspense>

        {/* Contributor Stats */}
        <Suspense fallback={<LoadingCard />}>
          <ContributorStats />
        </Suspense>
      </div>

      {/* Activity Chart */}
      <Suspense fallback={<LoadingCard />}>
        <ActivityChart />
      </Suspense>
    </div>
  )
}