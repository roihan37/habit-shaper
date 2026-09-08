import { useQueries } from '@tanstack/react-query'

import {
  fetchHabitStats,
  fetchTodayHabitRecord,
  getLocalCalendarDate,
  habitStatsQueryKey,
  habitTodayQueryKey,
  type HabitRecord,
  type HabitStats,
} from '../habits/use-habit-detail'
import { useHabits } from '../habits/use-habits'

export function useDashboardData() {
  const habitsQuery = useHabits()
  const habits = habitsQuery.data ?? []
  const today = getLocalCalendarDate()
  const statsQueries = useQueries({
    queries: habits.map((habit) => ({
      queryKey: habitStatsQueryKey(habit.id),
      queryFn: () => fetchHabitStats(habit.id),
      enabled: habitsQuery.isSuccess,
    })),
  })
  const todayQueries = useQueries({
    queries: habits.map((habit) => ({
      queryKey: habitTodayQueryKey(habit.id, today),
      queryFn: () => fetchTodayHabitRecord(habit.id, today),
      enabled: habitsQuery.isSuccess,
    })),
  })
  const statsByHabitId = new Map<string, HabitStats>(
    statsQueries.flatMap((query) =>
      query.data ? [[query.data.habitId, query.data]] : [],
    ),
  )
  const todayRecordByHabitId = new Map<
    string,
    HabitRecord | null | undefined
  >(habits.map((habit, index) => [habit.id, todayQueries[index]?.data]))
  const statsErrorHabitIds = new Set(
    habits.filter((_, index) => statsQueries[index]?.isError).map((habit) => habit.id),
  )
  const todayErrorHabitIds = new Set(
    habits.filter((_, index) => todayQueries[index]?.isError).map((habit) => habit.id),
  )

  return {
    habits,
    statsByHabitId,
    todayRecordByHabitId,
    statsErrorHabitIds,
    todayErrorHabitIds,
    isLoading: habitsQuery.isPending,
    isStatsLoading:
      habitsQuery.isSuccess &&
      (statsQueries.some((query) => query.isPending) ||
        todayQueries.some((query) => query.isPending)),
    isError: habitsQuery.isError,
    hasStatsError:
      statsQueries.some((query) => query.isError) ||
      todayQueries.some((query) => query.isError),
  }
}
