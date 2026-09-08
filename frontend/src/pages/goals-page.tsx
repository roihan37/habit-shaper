import { ArrowUpRight, CircleAlert, Link2, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { CreateGoalDialog } from '../goals/create-goal-dialog'
import { useGoals, type Goal } from '../goals/use-goals'
import { useHabits, type Habit } from '../habits/use-habits'

function GoalCard({ goal, habit }: { goal: Goal; habit: Habit }) {
  const isBuild = habit.type === 'BUILD'

  return (
    <Card className="h-full transition-colors hover:border-primary/30 hover:bg-muted/40">
      <CardContent className="flex h-full flex-col p-5">
        <span
          className="mb-4 grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Target className="size-4" />
        </span>
        <h2 className="text-base font-semibold leading-snug">{goal.title}</h2>
        {goal.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {goal.description}
          </p>
        )}

        <div className="mt-5 border-t pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Link2 className="size-3.5" aria-hidden="true" />
            Linked habit
          </p>
          <Link
            className="group flex items-center justify-between gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            to={`/habits/${habit.id}`}
            aria-label={`View linked habit ${habit.name}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{habit.name}</p>
              <Badge
                variant="outline"
                className={
                  isBuild
                    ? 'mt-2 border-primary/20 bg-primary/10 text-primary'
                    : 'mt-2 border-amber-200 bg-amber-50 text-amber-700'
                }
              >
                {isBuild ? 'Build' : 'Break'}
              </Badge>
            </div>
            <ArrowUpRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
              aria-hidden="true"
            />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function GoalsSkeleton() {
  return (
    <div
      className="grid gap-3 md:grid-cols-2"
      aria-label="Loading goals"
      aria-busy="true"
    >
      {[0, 1, 2, 3].map((item) => (
        <Card key={item}>
          <CardContent className="grid gap-3 p-5">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <div className="mt-2 border-t pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-5 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function GoalsPage() {
  const goalsQuery = useGoals()
  const habitsQuery = useHabits()
  const habitsById = new Map(
    (habitsQuery.data ?? []).map((habit) => [habit.id, habit]),
  )
  const goals = goalsQuery.data ?? []

  const retry = () => {
    void Promise.all([goalsQuery.refetch(), habitsQuery.refetch()])
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
      <header className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Your direction</p>
          <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Keep your goals connected to the habits that matter.
          </p>
        </div>
        <CreateGoalDialog habits={habitsQuery.data ?? []} />
      </header>

      {goalsQuery.isPending || habitsQuery.isPending ? (
        <GoalsSkeleton />
      ) : goalsQuery.isError || habitsQuery.isError ? (
        <Card role="alert" className="border-destructive/30">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive"
              aria-hidden="true"
            >
              <CircleAlert className="size-5" />
            </span>
            <div className="flex-1">
              <h2 className="font-semibold">Unable to load goals.</h2>
              <p className="mt-1 text-sm text-muted-foreground">Please try again.</p>
            </div>
            <Button variant="outline" onClick={retry}>Retry</Button>
          </CardContent>
        </Card>
      ) : goals.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <span
              className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Target className="size-6" />
            </span>
            <h2 className="text-lg font-semibold">No goals yet</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Create a goal linked to one of your habits.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section aria-label="Your goals" className="grid gap-3 md:grid-cols-2">
          {goals.map((goal) => {
            const habit = habitsById.get(goal.habitId)
            return habit ? <GoalCard key={goal.id} goal={goal} habit={habit} /> : null
          })}
        </section>
      )}
    </main>
  )
}
