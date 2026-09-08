import { prisma } from "../../database/prisma.js"
import type { HabitRecordStatus } from "../../generated/prisma/enums.js"

export const habitRecordRepository = {
  findByHabitAndDate(
    userId: string,
    habitId: string,
    recordDate: Date,
  ) {
    return prisma.habitRecord.findFirst({
      where: {
        habitId,
        recordDate,
        habit: { userId },
      },
    })
  },

  async upsertByHabitAndDate(
    userId: string,
    habitId: string,
    recordDate: Date,
    status: HabitRecordStatus,
  ) {
    const ownedHabit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
      select: { id: true },
    })

    if (!ownedHabit) return null

    return prisma.habitRecord.upsert({
      where: {
        habitId_recordDate: { habitId, recordDate },
      },
      create: { habitId, recordDate, status },
      update: { status },
    })
  },

  findByDateRange(
    userId: string,
    habitId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return prisma.habitRecord.findMany({
      where: {
        habitId,
        recordDate: { gte: startDate, lte: endDate },
        habit: { userId },
      },
      orderBy: [{ recordDate: "asc" }, { id: "asc" }],
    })
  },

  findHistory(userId: string, habitId: string) {
    return prisma.habitRecord.findMany({
      where: {
        habitId,
        habit: { userId },
      },
      orderBy: [{ recordDate: "asc" }, { id: "asc" }],
    })
  },
}
