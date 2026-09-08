import { randomUUID } from "node:crypto"

import { afterAll, afterEach, describe, expect, it } from "vitest"

import { prisma } from "../../database/prisma.js"
import { HabitType } from "../../generated/prisma/enums.js"
import { goalRepository } from "./goal.repository.js"

const createdUserIds = new Set<string>()

async function cleanUpCreatedUsers() {
  if (createdUserIds.size === 0) return

  await prisma.user.deleteMany({
    where: { id: { in: [...createdUserIds] } },
  })
  createdUserIds.clear()
}

async function createUser() {
  const user = await prisma.user.create({
    data: {
      email: `${randomUUID()}@example.com`,
      passwordHash: "test-password-hash",
    },
  })
  createdUserIds.add(user.id)
  return user
}

function createHabit(userId: string, name = "Read") {
  return prisma.habit.create({
    data: { userId, type: HabitType.BUILD, name },
  })
}

afterEach(cleanUpCreatedUsers)

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("goalRepository", () => {
  it("lists only goals owned by the requested user in deterministic order", async () => {
    const userA = await createUser()
    const userB = await createUser()
    const habitA = await createHabit(userA.id)
    const habitB = await createHabit(userB.id)
    const older = await prisma.goal.create({
      data: {
        userId: userA.id,
        habitId: habitA.id,
        title: "Older goal",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    })
    const newer = await prisma.goal.create({
      data: {
        userId: userA.id,
        habitId: habitA.id,
        title: "Newer goal",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    })
    const foreign = await prisma.goal.create({
      data: {
        userId: userB.id,
        habitId: habitB.id,
        title: "Foreign goal",
      },
    })

    const goals = await goalRepository.findAllByUserId(userA.id)

    expect(goals.map((goal) => goal.id)).toEqual([newer.id, older.id])
    expect(goals.some((goal) => goal.id === foreign.id)).toBe(false)
    expect(goals.every((goal) => goal.userId === userA.id)).toBe(true)
  })

  it("finds a goal only when both ID and owner match", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id)
    const goal = await goalRepository.create(owner.id, {
      habitId: habit.id,
      title: "Read consistently",
    })

    await expect(
      goalRepository.findByIdAndUserId(goal.id, owner.id),
    ).resolves.toMatchObject({ id: goal.id, userId: owner.id })
    await expect(
      goalRepository.findByIdAndUserId(goal.id, otherUser.id),
    ).resolves.toBeNull()
    await expect(
      goalRepository.findByIdAndUserId(randomUUID(), owner.id),
    ).resolves.toBeNull()
  })

  it("creates a goal for the trusted owner and linked habit", async () => {
    const user = await createUser()
    const habit = await createHabit(user.id)

    const goal = await goalRepository.create(user.id, {
      habitId: habit.id,
      title: "Read every day",
      description: "Finish one chapter",
    })

    await expect(
      prisma.goal.findUnique({
        where: { id: goal.id },
        include: { habit: true },
      }),
    ).resolves.toMatchObject({
      userId: user.id,
      habitId: habit.id,
      title: "Read every day",
      description: "Finish one chapter",
      habit: { id: habit.id, userId: user.id },
    })
  })

  it("updates only mutable fields for the correct owner", async () => {
    const owner = await createUser()
    const originalHabit = await createHabit(owner.id, "Read")
    const newHabit = await createHabit(owner.id, "Exercise")
    const goal = await goalRepository.create(owner.id, {
      habitId: originalHabit.id,
      title: "Original goal",
    })

    const result = await goalRepository.update(goal.id, owner.id, {
      habitId: newHabit.id,
      title: "Updated goal",
      description: "Updated description",
    })

    expect(result.count).toBe(1)
    await expect(
      prisma.goal.findUnique({ where: { id: goal.id } }),
    ).resolves.toMatchObject({
      id: goal.id,
      userId: owner.id,
      habitId: newHabit.id,
      title: "Updated goal",
      description: "Updated description",
    })
  })

  it("does not update a goal owned by another user", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id)
    const goal = await goalRepository.create(owner.id, {
      habitId: habit.id,
      title: "Original goal",
    })

    const result = await goalRepository.update(goal.id, otherUser.id, {
      title: "Changed",
    })

    expect(result.count).toBe(0)
    await expect(
      prisma.goal.findUnique({ where: { id: goal.id } }),
    ).resolves.toMatchObject({
      userId: owner.id,
      title: "Original goal",
    })
  })

  it("deletes a goal only for the correct owner", async () => {
    const owner = await createUser()
    const habit = await createHabit(owner.id)
    const goal = await goalRepository.create(owner.id, {
      habitId: habit.id,
      title: "Read consistently",
    })

    const result = await goalRepository.delete(goal.id, owner.id)

    expect(result.count).toBe(1)
    await expect(
      prisma.goal.findUnique({ where: { id: goal.id } }),
    ).resolves.toBeNull()
  })

  it("does not delete a goal owned by another user", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id)
    const goal = await goalRepository.create(owner.id, {
      habitId: habit.id,
      title: "Read consistently",
    })

    const result = await goalRepository.delete(goal.id, otherUser.id)

    expect(result.count).toBe(0)
    await expect(
      prisma.goal.findUnique({ where: { id: goal.id } }),
    ).resolves.toMatchObject({ id: goal.id, userId: owner.id })
  })
})
