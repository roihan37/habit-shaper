import { randomUUID } from "node:crypto"

import { afterAll, afterEach, describe, expect, it } from "vitest"

import { prisma } from "../../database/prisma.js"
import { HabitType } from "../../generated/prisma/enums.js"
import { habitRepository } from "./habit.repository.js"

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

async function createHabit(userId: string, type: HabitType, name: string) {
  return prisma.habit.create({
    data: { userId, type, name },
  })
}

afterEach(cleanUpCreatedUsers)

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("habitRepository", () => {
  it("finds only habits owned by the requested user", async () => {
    const userA = await createUser()
    const userB = await createUser()
    const userABuild = await createHabit(userA.id, HabitType.BUILD, "Read")
    const userABreak = await createHabit(userA.id, HabitType.BREAK, "Smoking")
    await createHabit(userB.id, HabitType.BUILD, "Exercise")

    const habits = await habitRepository.findAllByUserId(userA.id)

    expect(habits.map((habit) => habit.id)).toEqual(
      expect.arrayContaining([userABuild.id, userABreak.id]),
    )
    expect(habits).toHaveLength(2)
    expect(habits.every((habit) => habit.userId === userA.id)).toBe(true)
  })

  it.each([HabitType.BUILD, HabitType.BREAK])(
    "filters owned habits by type %s",
    async (type) => {
      const userA = await createUser()
      const userB = await createUser()
      await createHabit(userA.id, HabitType.BUILD, "Read")
      await createHabit(userA.id, HabitType.BREAK, "Smoking")
      await createHabit(userB.id, type, "Other user's habit")

      const habits = await habitRepository.findAllByUserId(userA.id, type)

      expect(habits).toHaveLength(1)
      expect(habits[0]).toMatchObject({ userId: userA.id, type })
    },
  )

  it("finds a habit only when both ID and owner match", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id, HabitType.BUILD, "Read")

    await expect(
      habitRepository.findByIdAndUserId(habit.id, owner.id),
    ).resolves.toMatchObject({ id: habit.id, userId: owner.id })
    await expect(
      habitRepository.findByIdAndUserId(habit.id, otherUser.id),
    ).resolves.toBeNull()
    await expect(
      habitRepository.findByIdAndUserId(randomUUID(), owner.id),
    ).resolves.toBeNull()
  })

  it("creates a habit for the caller-provided owner", async () => {
    const user = await createUser()

    const habit = await habitRepository.create(user.id, {
      name: "Meditate",
      description: "Ten minutes every morning",
      type: HabitType.BUILD,
    })

    await expect(
      prisma.habit.findUnique({ where: { id: habit.id } }),
    ).resolves.toMatchObject({
      userId: user.id,
      name: "Meditate",
      description: "Ten minutes every morning",
      type: HabitType.BUILD,
    })
  })

  it("updates only mutable fields for the correct owner", async () => {
    const owner = await createUser()
    const habit = await createHabit(owner.id, HabitType.BREAK, "Junk food")

    const result = await habitRepository.update(habit.id, owner.id, {
      name: "Avoid junk food",
      description: "Prepare meals ahead",
    })

    expect(result.count).toBe(1)
    await expect(
      prisma.habit.findUnique({ where: { id: habit.id } }),
    ).resolves.toMatchObject({
      userId: owner.id,
      name: "Avoid junk food",
      description: "Prepare meals ahead",
      type: HabitType.BREAK,
    })
  })

  it("does not update a habit owned by another user", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id, HabitType.BUILD, "Read")

    const result = await habitRepository.update(habit.id, otherUser.id, {
      name: "Changed",
    })

    expect(result.count).toBe(0)
    await expect(
      prisma.habit.findUnique({ where: { id: habit.id } }),
    ).resolves.toMatchObject({ name: "Read", userId: owner.id })
  })

  it("deletes a habit only for the correct owner", async () => {
    const owner = await createUser()
    const habit = await createHabit(owner.id, HabitType.BUILD, "Read")

    const result = await habitRepository.delete(habit.id, owner.id)

    expect(result.count).toBe(1)
    await expect(
      prisma.habit.findUnique({ where: { id: habit.id } }),
    ).resolves.toBeNull()
  })

  it("does not delete a habit owned by another user", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id, HabitType.BUILD, "Read")

    const result = await habitRepository.delete(habit.id, otherUser.id)

    expect(result.count).toBe(0)
    await expect(
      prisma.habit.findUnique({ where: { id: habit.id } }),
    ).resolves.toMatchObject({ id: habit.id, userId: owner.id })
  })
})
