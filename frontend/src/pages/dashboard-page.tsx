import { ArrowRight, CheckCircle2, CircleDashed, CircleOff, Flame, Leaf, Sprout, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Skeleton } from '../components/ui/skeleton'
import { useDashboardData } from '../dashboard/use-dashboard-data'
import type { HabitRecordStatus, HabitStats } from '../habits/use-habit-detail'
import type { Habit, HabitType } from '../habits/use-habits'

const statusLabels = {
  BUILD: { SUCCESS: 'Completed today', FAILURE: 'Missed today', PENDING: 'Pending today' },
  BREAK: { SUCCESS: 'Still clean today', FAILURE: 'Relapsed today', PENDING: 'Pending today' },
} as const

const statusStyles = {
  SUCCESS: 'border-primary/20 bg-primary/10 text-primary',
  FAILURE: 'border-destructive/20 bg-destructive/5 text-destructive',
  PENDING: 'border-border bg-muted text-muted-foreground',
} as const

function StatusBadge({ type, status }: { type: HabitType; status: HabitRecordStatus | 'PENDING' }) {
  const Icon = status === 'SUCCESS' ? CheckCircle2 : status === 'FAILURE' ? XCircle : CircleDashed
  return <Badge variant="outline" className={`gap-1.5 ${statusStyles[status]}`}><Icon className="size-3.5" aria-hidden="true" />{statusLabels[type][status]}</Badge>
}

function DashboardHabitCard({ habit, stats, todayStatus, statsError, todayError }: { habit: Habit; stats: HabitStats | undefined; todayStatus: HabitRecordStatus | 'PENDING' | undefined; statsError: boolean; todayError: boolean }) {
  const isBuild = habit.type === 'BUILD'
  return (
    <Card className="h-full transition-colors hover:border-primary/30">
      <CardContent className="flex h-full flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className={`grid size-9 place-items-center rounded-lg ${isBuild ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`} aria-hidden="true">
            {isBuild ? <Leaf className="size-4" /> : <CircleOff className="size-4" />}
          </span>
          <Badge variant="outline" className={isBuild ? 'border-primary/20 bg-primary/10 text-primary' : 'border-amber-200 bg-amber-50 text-amber-700'}>{isBuild ? 'Build' : 'Break'}</Badge>
        </div>
        <h3 className="text-base font-semibold leading-snug">{habit.name}</h3>
        <div className="mt-3">{todayError ? <Badge variant="outline" className="border-border bg-muted text-muted-foreground">Status unavailable</Badge> : todayStatus === undefined ? <Skeleton className="h-6 w-36 rounded-full" /> : <StatusBadge type={habit.type} status={todayStatus} />}</div>
        <div className="mt-5 grid gap-4 border-t pt-4">
          {statsError ? <p className="text-sm text-muted-foreground">Statistics unavailable.</p> : stats?.type === 'BUILD' && isBuild ? (
            <>
              <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Current streak</span><span className="font-semibold">{stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}</span></div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Weekly completion</span><span className="font-semibold">{stats.weekly.completionRate}%</span></div>
                <Progress value={stats.weekly.completionRate} aria-label={`${stats.weekly.completionRate}% weekly completion for ${habit.name}`} />
                <p className="mt-2 text-xs text-muted-foreground">{stats.weekly.completedDays} of {stats.weekly.eligibleDays} eligible days</p>
              </div>
            </>
          ) : stats?.type === 'BREAK' && !isBuild ? (
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Flame className="size-4 text-primary" aria-hidden="true" />Clean streak</span><span className="font-semibold">{stats.currentCleanStreak} {stats.currentCleanStreak === 1 ? 'day' : 'days'}</span></div>
          ) : <div className="grid gap-3"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-3/4" /></div>}
        </div>
        <Button asChild variant="outline" className="mt-5 w-full"><Link to={`/habits/${habit.id}`}>View details<ArrowRight aria-hidden="true" /></Link></Button>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return <div className="grid gap-10" aria-label="Loading dashboard" aria-busy="true">{[0, 1].map((section) => <section key={section}><Skeleton className="mb-4 h-6 w-32" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[0, 1].map((item) => <Skeleton key={item} className="h-72 rounded-xl" />)}</div></section>)}</div>
}

export function DashboardPage() {
  const dashboard = useDashboardData()
  const buildHabits = dashboard.habits.filter((habit) => habit.type === 'BUILD')
  const breakHabits = dashboard.habits.filter((habit) => habit.type === 'BREAK')

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
      <header className="mb-8"><p className="mb-2 text-sm font-semibold text-primary">Today at a glance</p><h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">See your current streaks and today&apos;s progress.</p></header>
      {dashboard.isLoading ? <DashboardSkeleton /> : dashboard.isError ? (
        <Card role="alert" className="border-destructive/30"><CardContent className="p-6"><h2 className="font-semibold">Unable to load dashboard.</h2><p className="mt-1 text-sm text-muted-foreground">Please try again.</p></CardContent></Card>
      ) : dashboard.habits.length === 0 ? (
        <Card className="border-dashed shadow-none"><CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><span className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true"><Sprout className="size-6" /></span><h2 className="text-lg font-semibold">No habits yet</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Create your first habit to start building better routines.</p><Button asChild className="mt-5"><Link to="/habits">Go to habits<ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card>
      ) : (
        <div className="grid gap-10">
          {dashboard.hasStatsError && <Card role="alert" className="border-destructive/30"><CardContent className="p-4 text-sm">Some habit data could not be loaded. Successfully loaded habits remain available.</CardContent></Card>}
          {([{ type: 'BUILD', title: 'Build habits', habits: buildHabits }, { type: 'BREAK', title: 'Break habits', habits: breakHabits }] as const).map((section) => (
            <section key={section.type} aria-labelledby={`${section.type.toLowerCase()}-dashboard-heading`}>
              <h2 className="mb-4 text-lg font-semibold tracking-tight" id={`${section.type.toLowerCase()}-dashboard-heading`}>{section.title}</h2>
              {section.habits.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{section.habits.map((habit) => {
                const todayRecord = dashboard.todayRecordByHabitId.get(habit.id)
                const todayStatus = todayRecord === null ? 'PENDING' : todayRecord?.status
                return <DashboardHabitCard key={habit.id} habit={habit} stats={dashboard.statsByHabitId.get(habit.id)} todayStatus={todayStatus} statsError={dashboard.statsErrorHabitIds.has(habit.id)} todayError={dashboard.todayErrorHabitIds.has(habit.id)} />
              })}</div> : <Card className="border-dashed shadow-none"><CardContent className="flex min-h-24 items-center justify-center p-6 text-center text-sm text-muted-foreground">No {section.type === 'BUILD' ? 'build' : 'break'} habits yet.</CardContent></Card>}
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
