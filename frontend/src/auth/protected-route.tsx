import {
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  LogOut,
  Menu,
  Sprout,
  Target,
} from 'lucide-react'
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { Button } from '../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { cn } from '../lib/utils'
import { useCurrentUser } from './use-current-user'
import { useLogout } from './use-logout'

const navigationItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/habits',
    label: 'Habits',
    icon: ListChecks,
  },
  {
    to: '/goals',
    label: 'Goals',
    icon: Target,
  },
]

export function ProtectedRoute() {
  const location = useLocation()
  const {
    data: currentUser,
    isError,
    isPending,
  } = useCurrentUser()

  const logoutMutation = useLogout()

  if (isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle
            className="size-4 animate-spin"
            aria-hidden="true"
          />
          Checking authentication…
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        <p className="text-sm text-muted-foreground">
          Unable to verify your session. Please try again.
        </p>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-5 px-5 py-3">
          {/* Brand */}
          <Link
            to="/dashboard"
            className="inline-flex shrink-0 items-center gap-2.5 rounded-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span
              className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
              aria-hidden="true"
            >
              <Sprout size={20} strokeWidth={2.25} />
            </span>

            <span className="hidden sm:inline">
              Habit Shaper
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Main navigation"
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted-foreground lg:inline">
              {currentUser.email}
            </span>

            {/* Desktop logout */}
            <div className="hidden md:block">
              <Button
                type="button"
                variant="outline"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
              >
                {logoutMutation.isPending ? (
                  <LoaderCircle
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <LogOut aria-hidden="true" />
                )}

                {logoutMutation.isPending
                  ? 'Logging out…'
                  : 'Log out'}
              </Button>
            </div>

            {/* Mobile navigation */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Open navigation menu"
                  >
                    <Menu aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48"
                >
                  {navigationItems.map((item) => {
                    const Icon = item.icon

                    return (
                      <DropdownMenuItem
                        key={item.to}
                        asChild
                      >
                        <Link to={item.to}>
                          <Icon aria-hidden="true" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    disabled={logoutMutation.isPending}
                    onSelect={() => logoutMutation.mutate()}
                  >
                    {logoutMutation.isPending ? (
                      <LoaderCircle
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <LogOut aria-hidden="true" />
                    )}

                    {logoutMutation.isPending
                      ? 'Logging out…'
                      : 'Log out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  )
}