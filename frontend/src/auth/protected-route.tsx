import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useCurrentUser } from './use-current-user'

export function ProtectedRoute() {
  const location = useLocation()
  const { data: currentUser, isError, isPending } = useCurrentUser()

  if (isPending) {
    return <main>Checking authentication…</main>
  }

  if (isError) {
    return <main>Unable to verify your session. Please try again.</main>
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
