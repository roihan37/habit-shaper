import { useQuery } from '@tanstack/react-query'

import { apiRequest } from '../services/api'

export type Goal = {
  id: string
  habitId: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export const goalsQueryKey = ['goals'] as const

export function useGoals() {
  return useQuery({
    queryKey: goalsQueryKey,
    queryFn: async () => {
      const response = await apiRequest<Goal[]>('/api/goals')
      return response?.data ?? []
    },
  })
}
