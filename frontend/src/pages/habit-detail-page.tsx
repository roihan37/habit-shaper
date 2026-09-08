import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarX2,
  CheckCircle2,
  CircleDashed,
  Flame,
  LoaderCircle,
  XCircle,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Skeleton } from '../components/ui/skeleton'
import {
  getLocalCalendarDate,
  habitRecordsQueryKey,
  habitStatsQueryKey,
  useBuildHabitStats,
  useHabit,
  useTodayHabitRecord,
  type HabitRecord,
  type HabitRecordStatus,
} from '../habits/use-habit-detail'
import { apiRequest } from '../services/api'

const todayState = {
  SUCCESS: {
    label: 'Completed today',
    className: 'border-primary/20 bg-primary/10 text-primary',
    icon: CheckCircle2,
  },
  FAILURE: {
    label: 'Missed today',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: XCircle,
  },
  PENDING: {
    label: 'Pending today',
    className: 'border-border bg-muted text-muted-foreground',
    icon: CircleDashed,
  },
} as const

function DetailSkeleton() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 sm:py-10" aria-label="Loading habit" aria-busy="true">
      <div className="grid gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-36 rounded-xl" />
        ))}
      </div>
    </main>
  )
}

export function HabitDetailPage() {
  const { habitId = '' } = useParams<{ habitId: string }>()
  const queryClient = useQueryClient()
  const today = getLocalCalendarDate()
  const habitQuery = useHabit(habitId)
  const isBuild = habitQuery.data?.type === 'BUILD'
  const statsQuery = useBuildHabitStats(habitId, isBuild)
  const todayQuery = useTodayHabitRecord(habitId, today, isBuild)
  const trackMutation = useMutation({
    mutationFn: (status: HabitRecordStatus) =>
      apiRequest<HabitRecord>(`/api/habits/${habitId}/today`, {
        method: 'PUT',
        body: { status },
      }),
    onSuccess: async (_response, status) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: habitStatsQueryKey(habitId) }),
        queryClient.invalidateQueries({ queryKey: habitRecordsQueryKey(habitId) }),
      ])
      toast.success(
        status === 'SUCCESS'
          ? 'Marked as completed for today.'
          : 'Marked as missed for today.',
      )
    },
    onError: () => {
      toast.error("Unable to update today's habit status.")
    },
  })

  if (habitQuery.isPending) return <DetailSkeleton />

  if (habitQuery.isError || !habitQuery.data) {
    return (
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
        <Card role="alert" className="border-destructive/30">
          <CardContent className="p-6">
            <h1 className="font-semibold">Unable to load habit.</h1>
            <p className="mt-1 text-sm text-muted-foreground">Please try again.</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const habit = habitQuery.data

  if (habit.type !== 'BUILD') {
    return (
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" to="/habits">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to habits
        </Link>
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Break</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{habit.name}</h1>
        {habit.description && <p className="mt-2 text-muted-foreground">{habit.description}</p>}
      </main>
    )
  }

  const status = todayQuery.data?.status ?? 'PENDING'
  const state = todayState[status]
  const StateIcon = state.icon
  const stats = statsQuery.data
  const statsUnavailable = statsQuery.isError || todayQuery.isError

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
      <Link className="mb-6 inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" to="/habits">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to habits
      </Link>

      <header className="mb-8">
        <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">Build</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{habit.name}</h1>
        {habit.description && <p className="mt-2 max-w-2xl text-muted-foreground">{habit.description}</p>}
      </header>

      <Card className="mb-8">
        <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Today</p>
            {todayQuery.isPending ? (
              <Skeleton className="mt-2 h-7 w-36" />
            ) : (
              <Badge variant="outline" className={`mt-2 gap-1.5 ${state.className}`}>
                <StateIcon className="size-3.5" aria-hidden="true" />
                {state.label}
              </Badge>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button disabled={trackMutation.isPending} onClick={() => trackMutation.mutate('SUCCESS')}>
              {trackMutation.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {trackMutation.isPending ? 'Saving…' : 'Completed today'}
            </Button>
            <Button variant="outline" disabled={trackMutation.isPending} onClick={() => trackMutation.mutate('FAILURE')}>
              Mark as missed
            </Button>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="statistics-heading">
        <h2 className="mb-4 text-lg font-semibold" id="statistics-heading">Statistics</h2>
        {statsQuery.isPending || todayQuery.isPending ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-36 rounded-xl" />)}
          </div>
        ) : statsUnavailable || !stats ? (
          <Card role="alert" className="border-destructive/30">
            <CardContent className="p-6">
              <p className="font-semibold">Unable to load habit statistics.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-5"><Flame className="mb-5 size-5 text-primary" aria-hidden="true" /><p className="text-sm text-muted-foreground">Current streak</p><p className="mt-1 text-2xl font-semibold">{stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}</p></CardContent></Card>
            <Card><CardContent className="p-5"><CalendarCheck2 className="mb-5 size-5 text-primary" aria-hidden="true" /><div className="flex items-end justify-between gap-3"><p className="text-sm text-muted-foreground">Weekly completion</p><p className="text-2xl font-semibold">{stats.weekly.completionRate}%</p></div><Progress className="mt-4" value={stats.weekly.completionRate} aria-label={`${stats.weekly.completionRate}% weekly completion`} /><p className="mt-3 text-xs text-muted-foreground">{stats.weekly.completedDays} of {stats.weekly.eligibleDays} eligible days completed</p></CardContent></Card>
            <Card><CardContent className="p-5"><CalendarX2 className="mb-5 size-5 text-amber-700" aria-hidden="true" /><p className="text-sm text-muted-foreground">Missed days</p><p className="mt-1 text-2xl font-semibold">{stats.weekly.missedDays}</p></CardContent></Card>
          </div>
        )}
      </section>
    </main>
  )
}
