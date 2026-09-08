import { createBrowserRouter } from 'react-router-dom'

import App from '../App'
import { ProtectedRoute } from '../auth/protected-route'
import {
  DashboardPage,
  GoalsPage,
  HabitDetailPage,
  HabitsPage,
  NotFoundPage,
} from '../pages/route-pages'
import { LoginPage } from '../pages/login-page'
import { RegisterPage } from '../pages/register-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/habits',
        element: <HabitsPage />,
      },
      {
        path: '/habits/:habitId',
        element: <HabitDetailPage />,
      },
      {
        path: '/goals',
        element: <GoalsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
