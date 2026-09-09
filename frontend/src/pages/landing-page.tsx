import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Flame,
  Sprout,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '../components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

const features = [
  {
    title: 'Build better habits',
    description:
      'Track positive habits every day and keep your streak moving forward.',
    icon: CheckCircle2,
  },
  {
    title: 'Break unwanted habits',
    description:
      'Track clean days, record relapses, and rebuild your momentum.',
    icon: Flame,
  },
  {
    title: 'Stay focused on goals',
    description:
      'Connect goals to your habits so each daily action has a clear purpose.',
    icon: Target,
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span
              className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
              aria-hidden="true"
            >
              <Sprout size={20} strokeWidth={2.25} />
            </span>

            <span>Habit Shaper</span>
          </Link>

          <nav
            className="flex items-center gap-2"
            aria-label="Landing navigation"
          >
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>

            <Button asChild>
              <Link to="/register">
                Get started
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Sprout className="size-4" aria-hidden="true" />
                Build consistency, one day at a time
              </div>

              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Shape better habits.
                <span className="block text-primary">
                  See your progress clearly.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Habit Shaper helps you build positive habits, break unwanted
                ones, track streaks, and keep your goals connected to daily
                action.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/register">
                    Start shaping habits
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>

                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">
                    I already have an account
                  </Link>
                </Button>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Simple daily tracking. No unnecessary complexity.
              </p>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Today
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      Your habit snapshot
                    </h2>
                  </div>

                  <BarChart3
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                </div>

                <div className="grid gap-3">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">Morning Exercise</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Build habit
                        </p>
                      </div>

                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        Completed
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Current streak
                      </span>
                      <span className="font-semibold">
                        6 days
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">No Smoking</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Break habit
                        </p>
                      </div>

                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        Still clean
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Clean streak
                      </span>
                      <span className="font-semibold">
                        12 days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">
              Everything you need
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Focus on progress, not complexity
            </h2>

            <p className="mt-4 text-muted-foreground">
              A lightweight habit tracker built around the essentials:
              daily action, streaks, weekly progress, and goals.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-3 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon
                        className="size-5"
                        aria-hidden="true"
                      />
                    </div>

                    <CardTitle className="text-lg">
                      {feature.title}
                    </CardTitle>

                    <CardDescription className="leading-6">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold text-primary">
                  How it works
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  A simple loop that keeps you moving
                </h2>

                <p className="mt-4 max-w-lg text-muted-foreground">
                  Create a habit, track today, and let the app turn your daily
                  actions into visible progress.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    step: '01',
                    title: 'Create a habit',
                    text: 'Choose whether you want to build a positive habit or break an unwanted one.',
                  },
                  {
                    step: '02',
                    title: 'Track your day',
                    text: 'Mark your daily progress and keep an accurate record of your current state.',
                  },
                  {
                    step: '03',
                    title: 'Review progress',
                    text: 'See streaks, weekly completion, missed days, and goals linked to your habits.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-4 rounded-xl border border-border bg-background p-5"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                      {item.step}
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-10 text-center sm:px-10">
            <h2 className="text-3xl font-semibold tracking-tight">
              Start shaping your habits today
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Build consistency, track progress, and stay focused on what you
              want to improve.
            </p>

            <div className="mt-6">
              <Button size="lg" asChild>
                <Link to="/register">
                  Create your account
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <Sprout className="size-4 text-primary" aria-hidden="true" />
            Habit Shaper
          </div>

          <p>
            Build better habits, one day at a time.
          </p>
        </div>
      </footer>
    </div>
  )
}