import { LoaderCircle, LogOut, Sprout } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { useLogout } from './use-logout'
import { useCurrentUser } from './use-current-user'

export function ProtectedRoute() {
  const location = useLocation()
  const { data: currentUser, isError, isPending } = useCurrentUser()
  const logoutMutation = useLogout()

  if (isPending) {
    return <main>Checking authentication…</main>
  }

  if (isError) {
    return <main>Unable to verify your session. Please try again.</main>
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link
            className="inline-flex items-center gap-2.5 rounded-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            to="/dashboard"
          >
            <span
              className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
              aria-hidden="true"
            >
              <Sprout size={20} strokeWidth={2.25} />
            </span>
            Habit Shaper
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {currentUser.email}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              {logoutMutation.isPending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOut aria-hidden="true" />
              )}
              {logoutMutation.isPending ? 'Logging out…' : 'Log out'}
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
