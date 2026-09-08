import { prisma } from "../../database/prisma.js"

export type CreateGoalData = {
  habitId: string
  title: string
  description?: string | null
}

export type UpdateGoalData = {
  habitId?: string
  title?: string
  description?: string | null
}

export const goalRepository = {
  findAllByUserId(userId: string, habitId?: string) {
    return prisma.goal.findMany({
      where: {
        userId,
        ...(habitId === undefined ? {} : { habitId }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    })
  },

  findByIdAndUserId(goalId: string, userId: string) {
    return prisma.goal.findFirst({
      where: { id: goalId, userId },
    })
  },

  create(userId: string, data: CreateGoalData) {
    return prisma.goal.create({
      data: {
        userId,
        habitId: data.habitId,
        title: data.title,
        description: data.description,
      },
    })
  },

  update(goalId: string, userId: string, data: UpdateGoalData) {
    return prisma.goal.updateMany({
      where: { id: goalId, userId },
      data: {
        habitId: data.habitId,
        title: data.title,
        description: data.description,
      },
    })
  },

  delete(goalId: string, userId: string) {
    return prisma.goal.deleteMany({
      where: { id: goalId, userId },
    })
  },
}
