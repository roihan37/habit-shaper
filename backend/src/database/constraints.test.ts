import { randomUUID } from "node:crypto"
import { afterAll, afterEach, describe, expect, it } from "vitest"
import { HabitRecordStatus, HabitType } from "../generated/prisma/enums.js"
import { prisma } from "./prisma.js"

const passwordHash = "test-password-hash"
const createdUserIds = new Set<string>()

async function cleanUpCreatedUsers() {
  if (createdUserIds.size === 0) {
    return
  }

  await prisma.user.deleteMany({
    where: { id: { in: [...createdUserIds] } },
  })
  createdUserIds.clear()
}

async function createUser() {
  const user = await prisma.user.create({
    data: {
      email: `${randomUUID()}@example.com`,
      passwordHash,
    },
  })

  createdUserIds.add(user.id)
  return user
}

async function createHabit(userId: string) {
  return prisma.habit.create({
    data: {
      userId,
      name: "Read",
      type: HabitType.BUILD,
    },
  })
}

describe("database constraints", () => {
  afterEach(cleanUpCreatedUsers)

  afterAll(async () => {
    await cleanUpCreatedUsers()
    await prisma.$disconnect()
  })

  it("rejects duplicate user emails", async () => {
    const email = `${randomUUID()}@example.com`

    const user = await prisma.user.create({ data: { email, passwordHash } })
    createdUserIds.add(user.id)

    await expect(
      prisma.user.create({ data: { email, passwordHash } }),
    ).rejects.toMatchObject({ code: "P2002" })
  })

  it("rejects duplicate records for the same habit and date", async () => {
    const user = await createUser()
    const habit = await createHabit(user.id)
    const recordDate = new Date("2026-09-08T00:00:00.000Z")

    await prisma.habitRecord.create({
      data: {
        habitId: habit.id,
        recordDate,
        status: HabitRecordStatus.SUCCESS,
      },
    })

    await expect(
      prisma.habitRecord.create({
        data: {
          habitId: habit.id,
          recordDate,
          status: HabitRecordStatus.FAILURE,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" })
  })

  it("requires a habit to reference an existing user", async () => {
    await expect(
      createHabit(randomUUID()),
    ).rejects.toMatchObject({ code: "P2003" })
  })

  it("requires a habit record to reference an existing habit", async () => {
    await expect(
      prisma.habitRecord.create({
        data: {
          habitId: randomUUID(),
          recordDate: new Date("2026-09-08T00:00:00.000Z"),
          status: HabitRecordStatus.SUCCESS,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" })
  })

  it("requires a goal to reference an existing user", async () => {
    const user = await createUser()
    const habit = await createHabit(user.id)

    await expect(
      prisma.goal.create({
        data: {
          userId: randomUUID(),
          habitId: habit.id,
          title: "Read consistently",
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" })
  })

  it("requires a goal to reference an existing habit", async () => {
    const user = await createUser()

    await expect(
      prisma.goal.create({
        data: {
          userId: user.id,
          habitId: randomUUID(),
          title: "Read consistently",
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" })
  })

  it("deleting a habit removes its records and goals", async () => {
    const user = await createUser()
    const habit = await createHabit(user.id)

    await prisma.habitRecord.create({
      data: {
        habitId: habit.id,
        recordDate: new Date("2026-09-08T00:00:00.000Z"),
        status: HabitRecordStatus.SUCCESS,
      },
    })
    await prisma.goal.create({
      data: {
        userId: user.id,
        habitId: habit.id,
        title: "Read consistently",
      },
    })

    await prisma.habit.delete({ where: { id: habit.id } })

    await expect(
      prisma.habitRecord.count({ where: { habitId: habit.id } }),
    ).resolves.toBe(0)
    await expect(
      prisma.goal.count({ where: { habitId: habit.id } }),
    ).resolves.toBe(0)
  })

  it("deleting a user removes all owned data", async () => {
    const user = await createUser()
    const habit = await createHabit(user.id)

    await prisma.habitRecord.create({
      data: {
        habitId: habit.id,
        recordDate: new Date("2026-09-08T00:00:00.000Z"),
        status: HabitRecordStatus.SUCCESS,
      },
    })
    await prisma.goal.create({
      data: {
        userId: user.id,
        habitId: habit.id,
        title: "Read consistently",
      },
    })

    await prisma.user.delete({ where: { id: user.id } })

    await expect(
      prisma.habit.count({ where: { userId: user.id } }),
    ).resolves.toBe(0)
    await expect(
      prisma.habitRecord.count({ where: { habitId: habit.id } }),
    ).resolves.toBe(0)
    await expect(
      prisma.goal.count({ where: { userId: user.id } }),
    ).resolves.toBe(0)
  })
})
