import { Link, useParams } from 'react-router-dom'

function Page({ title }: { title: string }) {
  return (
    <main>
      <h1>{title}</h1>
    </main>
  )
}

export function DashboardPage() {
  return <Page title="Dashboard" />
}

export function HabitDetailPage() {
  const { habitId } = useParams<{ habitId: string }>()

  return <Page title={`Habit ${habitId}`} />
}

export function GoalsPage() {
  return <Page title="Goals" />
}

export function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <Link to="/">Return home</Link>
    </main>
  )
}
