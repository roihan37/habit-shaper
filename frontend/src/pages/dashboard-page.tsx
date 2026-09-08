import { useDashboardData } from '../dashboard/use-dashboard-data'

export function DashboardPage() {
  const dashboard = useDashboardData()

  return (
    <main aria-busy={dashboard.isLoading || dashboard.isStatsLoading}>
      <h1>Dashboard</h1>
      {(dashboard.isError || dashboard.hasStatsError) && (
        <p role="alert">Unable to load dashboard data.</p>
      )}
    </main>
  )
}
