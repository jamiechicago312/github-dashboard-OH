'use client'

import useSWR from 'swr'
import { TrendingUp } from 'lucide-react'
import { DashboardData } from '@/types/github'
import { LoadingCard } from './loading-card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Generate sample historical data for demonstration
// In a real implementation, this would come from your database or API
function generateHistoricalData() {
  const data = []
  const now = new Date()
  
  // Generate 12 months of data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    
    // Simulate realistic growth patterns
    const baseMonth = 11 - i
    data.push({
      month: monthName,
      // Left Y-axis (Lines) - High volume metrics
      stars: Math.floor(45000 + (baseMonth * 1200) + (Math.random() * 800)),
      forks: Math.floor(8000 + (baseMonth * 150) + (Math.random() * 100)),
      commits: Math.floor(15000 + (baseMonth * 800) + (Math.random() * 400)),
      contributors: Math.floor(800 + (baseMonth * 25) + (Math.random() * 15)),
      
      // Right Y-axis (Bars) - Lower volume metrics  
      prs_closed: Math.floor(80 + (Math.random() * 40)),
      issues_closed: Math.floor(120 + (Math.random() * 60))
    })
  }
  
  return data
}

export default function AllTimeTrendsChart() {
  const { data: dashboardData, error, isLoading } = useSWR<DashboardData>(
    '/api/github/dashboard',
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  )

  if (isLoading) return <LoadingCard />

  if (error) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-heading font-semibold mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>All-Time Repository Trends</span>
        </h3>
        <div className="text-center text-muted-foreground">
          <p>Failed to load trends data</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  // For now, use generated data. In the future, this should come from historical database
  const historicalData = generateHistoricalData()

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>All-Time Repository Trends</span>
        </h3>
        <div className="text-sm text-muted-foreground">
          Last 12 months
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            
            {/* Left Y-axis for high-volume metrics (Lines) */}
            <YAxis 
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            
            {/* Right Y-axis for low-volume metrics (Bars) */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: any, name: string) => {
                const labels: { [key: string]: string } = {
                  stars: 'Stars',
                  forks: 'Forks', 
                  commits: 'Commits',
                  contributors: 'Contributors',
                  prs_closed: 'PRs Closed',
                  issues_closed: 'Issues Closed'
                }
                return [typeof value === 'number' ? value.toLocaleString() : value, labels[name] || name]
              }}
            />
            
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            
            {/* Lines for high-volume metrics (Left Y-axis) */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="stars" 
              stroke="#fbbf24" 
              strokeWidth={2}
              dot={{ fill: '#fbbf24', strokeWidth: 2, r: 4 }}
              name="Stars"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="forks" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="Forks"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="commits" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Commits"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="contributors" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              name="Contributors"
            />
            
            {/* Bars for low-volume metrics (Right Y-axis) */}
            <Bar 
              yAxisId="right"
              dataKey="prs_closed" 
              fill="#ef4444" 
              fillOpacity={0.7}
              name="PRs Closed"
            />
            <Bar 
              yAxisId="right"
              dataKey="issues_closed" 
              fill="#f97316" 
              fillOpacity={0.7}
              name="Issues Closed"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend explanation */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>Lines (left axis): High-volume cumulative metrics • Bars (right axis): Monthly activity metrics</p>
      </div>
    </div>
  )
}