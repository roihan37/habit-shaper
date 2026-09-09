import { createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '../auth/protected-route'
import { DashboardPage } from '../pages/dashboard-page'
import { NotFoundPage } from '../pages/route-pages'
import { GoalsPage } from '../pages/goals-page'
import { HabitDetailPage } from '../pages/habit-detail-page'
import { HabitsPage } from '../pages/habits-page'
import { LoginPage } from '../pages/login-page'
import { RegisterPage } from '../pages/register-page'
import { LandingPage } from '@/pages/landing-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
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
