import { useQuery } from '@tanstack/react-query'

import { apiRequest } from '../services/api'

export type HabitType = 'BUILD' | 'BREAK'

export type Habit = {
  id: string
  name: string
  description: string | null
  type: HabitType
  createdAt: string
  updatedAt: string
}

export const habitsQueryKey = ['habits'] as const
export const habitQueryKey = (habitId: string) => ['habits', habitId] as const

export function useHabits() {
  return useQuery({
    queryKey: habitsQueryKey,
    queryFn: async () => {
      const response = await apiRequest<Habit[]>('/api/habits')
      return response?.data ?? []
    },
  })
}
