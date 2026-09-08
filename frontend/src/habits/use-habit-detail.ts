import { useQuery } from '@tanstack/react-query'

import { apiRequest } from '../services/api'
import { habitQueryKey, type Habit } from './use-habits'

export type HabitRecordStatus = 'SUCCESS' | 'FAILURE'

export type HabitRecord = {
  id: string
  habitId: string
  recordDate: string
  status: HabitRecordStatus
}

export type BuildHabitStats = {
  habitId: string
  type: 'BUILD'
  currentStreak: number
  weekly: {
    weekStart: string
    weekEnd: string
    completedDays: number
    missedDays: number
    eligibleDays: number
    completionRate: number
  }
}

export type BreakHabitStats = {
  habitId: string
  type: 'BREAK'
  currentCleanStreak: number
}

export type HabitStats = BuildHabitStats | BreakHabitStats

export const habitStatsQueryKey = (habitId: string) =>
  ['habits', habitId, 'stats'] as const
export const habitRecordsQueryKey = (habitId: string) =>
  ['habits', habitId, 'records'] as const
export const habitTodayQueryKey = (habitId: string, date: string) =>
  [...habitRecordsQueryKey(habitId), 'today', date] as const

export function getLocalCalendarDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useHabit(habitId: string) {
  return useQuery({
    queryKey: habitQueryKey(habitId),
    queryFn: async () => {
      const response = await apiRequest<Habit>(`/api/habits/${habitId}`)
      return response?.data
    },
  })
}

export async function fetchHabitStats(habitId: string) {
  const response = await apiRequest<HabitStats>(
    `/api/habits/${habitId}/stats`,
  )
  return response?.data
}

export function useHabitStats(habitId: string, enabled: boolean) {
  return useQuery({
    queryKey: habitStatsQueryKey(habitId),
    queryFn: () => fetchHabitStats(habitId),
    enabled,
  })
}

export function useTodayHabitRecord(
  habitId: string,
  date: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: habitTodayQueryKey(habitId, date),
    queryFn: async () => {
      const response = await apiRequest<HabitRecord[]>(
        `/api/habits/${habitId}/records?from=${date}&to=${date}`,
      )
      return response?.data[0] ?? null
    },
    enabled,
  })
}
