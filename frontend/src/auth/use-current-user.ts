import { useQuery } from '@tanstack/react-query'

import { ApiError, apiRequest } from '../services/api'

export type CurrentUser = {
  id: string
  email: string
}

export const currentUserQueryKey = ['auth', 'current-user'] as const

export async function fetchCurrentUser() {
  try {
    const response = await apiRequest<CurrentUser>('/api/auth/me')
    return response?.data ?? null
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 401) && failureCount < 1,
  })
}
