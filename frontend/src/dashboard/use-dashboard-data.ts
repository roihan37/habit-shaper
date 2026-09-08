import { useQueries } from '@tanstack/react-query'

import {
  fetchHabitStats,
  habitStatsQueryKey,
  type HabitStats,
} from '../habits/use-habit-detail'
import { useHabits } from '../habits/use-habits'

export function useDashboardData() {
  const habitsQuery = useHabits()
  const habits = habitsQuery.data ?? []
  const statsQueries = useQueries({
    queries: habits.map((habit) => ({
      queryKey: habitStatsQueryKey(habit.id),
      queryFn: () => fetchHabitStats(habit.id),
      enabled: habitsQuery.isSuccess,
    })),
  })
  const statsByHabitId = new Map<string, HabitStats>(
    statsQueries.flatMap((query) =>
      query.data ? [[query.data.habitId, query.data]] : [],
    ),
  )

  return {
    habits,
    statsByHabitId,
    isLoading: habitsQuery.isPending,
    isStatsLoading:
      habitsQuery.isSuccess && statsQueries.some((query) => query.isPending),
    isError: habitsQuery.isError,
    hasStatsError: statsQueries.some((query) => query.isError),
  }
}
