import { Link } from 'react-router-dom'

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

export function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <Link to="/">Return home</Link>
    </main>
  )
}
