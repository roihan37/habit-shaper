import { ArrowUpRight, CircleAlert, CircleOff, Leaf, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { useHabits, type Habit, type HabitType } from '../habits/use-habits'

const sectionConfig = {
  BUILD: {
    title: 'Build habits',
    description: 'Positive routines you want to establish.',
    empty: 'No build habits yet.',
    icon: Leaf,
    iconClassName: 'bg-primary/10 text-primary',
    badgeClassName: 'border-primary/20 bg-primary/10 text-primary',
  },
  BREAK: {
    title: 'Break habits',
    description: 'Patterns you are working to leave behind.',
    empty: 'No break habits yet.',
    icon: CircleOff,
    iconClassName: 'bg-amber-100 text-amber-700',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
  },
} satisfies Record<
  HabitType,
  {
    title: string
    description: string
    empty: string
    icon: typeof Leaf
    iconClassName: string
    badgeClassName: string
  }
>

function HabitCard({ habit }: { habit: Habit }) {
  const config = sectionConfig[habit.type]

  return (
    <Link
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      to={`/habits/${habit.id}`}
      aria-label={`View ${habit.name}`}
    >
      <Card className="h-full transition-colors group-hover:border-primary/30 group-hover:bg-muted/40">
        <CardContent className="flex h-full items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <Badge
              variant="outline"
              className={`mb-3 ${config.badgeClassName}`}
            >
              {habit.type === 'BUILD' ? 'Build' : 'Break'}
            </Badge>
            <h3 className="text-base font-semibold leading-snug text-foreground">
              {habit.name}
            </h3>
            {habit.description && (
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {habit.description}
              </p>
            )}
          </div>
          <ArrowUpRight
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </CardContent>
      </Card>
    </Link>
  )
}

function HabitSection({ type, habits }: { type: HabitType; habits: Habit[] }) {
  const config = sectionConfig[type]
  const Icon = config.icon

  return (
    <section aria-labelledby={`${type.toLowerCase()}-habits-heading`}>
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-lg ${config.iconClassName}`}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>
        <div>
          <h2
            className="text-lg font-semibold tracking-tight"
            id={`${type.toLowerCase()}-habits-heading`}
          >
            {config.title}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>

      {habits.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-28 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {config.empty}
          </CardContent>
        </Card>
      )}
    </section>
  )
}

function HabitListSkeleton() {
  return (
    <div className="grid gap-10" aria-label="Loading habits" aria-busy="true">
      {[0, 1].map((section) => (
        <section key={section}>
          <div className="mb-4 flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="grid gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-60 max-w-[70vw]" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((item) => (
              <Card key={item}>
                <CardContent className="grid gap-3 p-5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function HabitsPage() {
  const habitsQuery = useHabits()
  const habits = habitsQuery.data ?? []
  const buildHabits = habits.filter((habit) => habit.type === 'BUILD')
  const breakHabits = habits.filter((habit) => habit.type === 'BREAK')

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold text-primary">Your routines</p>
        <h1 className="text-3xl font-semibold tracking-tight">Habits</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Manage the habits you want to build and break.
        </p>
      </header>

      {habitsQuery.isPending ? (
        <HabitListSkeleton />
      ) : habitsQuery.isError ? (
        <Card role="alert" className="border-destructive/30">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive"
              aria-hidden="true"
            >
              <CircleAlert className="size-5" />
            </span>
            <div className="flex-1">
              <h2 className="font-semibold">Unable to load habits.</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please try again.
              </p>
            </div>
            <Button variant="outline" onClick={() => habitsQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : habits.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <span
              className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Sprout className="size-6" />
            </span>
            <h2 className="text-lg font-semibold">No habits yet</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Start by creating a habit you want to build or break.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-10">
          <HabitSection type="BUILD" habits={buildHabits} />
          <HabitSection type="BREAK" habits={breakHabits} />
        </div>
      )}
    </main>
  )
}
