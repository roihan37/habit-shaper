import { prisma } from "../../database/prisma.js"
import type { HabitType } from "../../generated/prisma/enums.js"

export type CreateHabitData = {
  name: string
  description?: string | null
  type: HabitType
}

export type UpdateHabitData = {
  name?: string
  description?: string | null
}

export const habitRepository = {
  findAllByUserId(userId: string, type?: HabitType) {
    return prisma.habit.findMany({
      where: {
        userId,
        ...(type === undefined ? {} : { type }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    })
  },

  findByIdAndUserId(habitId: string, userId: string) {
    return prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
      },
    })
  },

  create(userId: string, data: CreateHabitData) {
    return prisma.habit.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        type: data.type,
      },
    })
  },

  update(habitId: string, userId: string, data: UpdateHabitData) {
    return prisma.habit.updateMany({
      where: {
        id: habitId,
        userId,
      },
      data: {
        name: data.name,
        description: data.description,
      },
    })
  },

  delete(habitId: string, userId: string) {
    return prisma.habit.deleteMany({
      where: {
        id: habitId,
        userId,
      },
    })
  },
}
