import { randomUUID } from "node:crypto"

import bcrypt from "bcrypt"
import request from "supertest"
import { afterAll, afterEach, describe, expect, it } from "vitest"

import { app } from "../../app.js"
import { prisma } from "../../database/prisma.js"
import {
  HabitRecordStatus,
  HabitType,
} from "../../generated/prisma/enums.js"

const createdUserIds = new Set<string>()

async function cleanUpCreatedUsers() {
  if (createdUserIds.size === 0) return

  await prisma.user.deleteMany({
    where: { id: { in: [...createdUserIds] } },
  })
  createdUserIds.clear()
}

async function createUser(password = "password123") {
  const user = await prisma.user.create({
    data: {
      email: `${randomUUID()}@example.com`,
      passwordHash: await bcrypt.hash(password, 4),
    },
  })
  createdUserIds.add(user.id)
  return user
}

async function login(email: string, password = "password123") {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password })
  const cookie = response.headers["set-cookie"]?.[0]
  if (!cookie) throw new Error("Expected login to issue an authentication cookie")
  return cookie
}

function createHabit(
  userId: string,
  type: HabitType = HabitType.BUILD,
  name = "Read",
) {
  return prisma.habit.create({
    data: { userId, type, name },
  })
}

const habitNotFoundResponse = {
  error: {
    code: "HABIT_NOT_FOUND",
    message: "Habit not found",
  },
}

afterEach(cleanUpCreatedUsers)

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("Habit CRUD", () => {
  it("requires authentication for every habit endpoint", async () => {
    const habitId = randomUUID()
    const responses = await Promise.all([
      request(app).get("/api/habits"),
      request(app).post("/api/habits").send({ name: "Read", type: "BUILD" }),
      request(app).get(`/api/habits/${habitId}`),
      request(app).patch(`/api/habits/${habitId}`).send({ name: "Updated" }),
      request(app).delete(`/api/habits/${habitId}`),
    ])

    for (const response of responses) {
      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED")
    }
  })

  it("lists only the authenticated user's habits and filters by type", async () => {
    const userA = await createUser()
    const userB = await createUser()
    const cookie = await login(userA.email)
    const buildHabit = await createHabit(userA.id, HabitType.BUILD, "Read")
    const breakHabit = await createHabit(userA.id, HabitType.BREAK, "Smoking")
    const otherHabit = await createHabit(userB.id, HabitType.BUILD, "Exercise")

    const all = await request(app).get("/api/habits").set("Cookie", cookie)
    const build = await request(app)
      .get("/api/habits?type=BUILD")
      .set("Cookie", cookie)
    const breakResult = await request(app)
      .get("/api/habits?type=BREAK")
      .set("Cookie", cookie)

    expect(all.status).toBe(200)
    expect(all.body.data.map((habit: { id: string }) => habit.id)).toEqual(
      expect.arrayContaining([buildHabit.id, breakHabit.id]),
    )
    expect(all.body.data).toHaveLength(2)
    expect(all.body.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: otherHabit.id })]),
    )
    expect(all.body.data[0]).not.toHaveProperty("userId")
    expect(build.body.data).toEqual([
      expect.objectContaining({ id: buildHabit.id, type: HabitType.BUILD }),
    ])
    expect(breakResult.body.data).toEqual([
      expect.objectContaining({ id: breakHabit.id, type: HabitType.BREAK }),
    ])
  })

  it("rejects an invalid habit type filter", async () => {
    const user = await createUser()
    const cookie = await login(user.email)

    const response = await request(app)
      .get("/api/habits?type=INVALID")
      .set("Cookie", cookie)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("VALIDATION_ERROR")
  })

  it.each([HabitType.BUILD, HabitType.BREAK])(
    "creates an owned %s habit",
    async (type) => {
      const user = await createUser()
      const cookie = await login(user.email)

      const response = await request(app)
        .post("/api/habits")
        .set("Cookie", cookie)
        .send({ name: "  Exercise  ", description: "Every morning", type })

      expect(response.status).toBe(201)
      expect(response.body.data).toMatchObject({
        name: "Exercise",
        description: "Every morning",
        type,
      })
      expect(response.body.data).not.toHaveProperty("userId")
      await expect(
        prisma.habit.findUnique({ where: { id: response.body.data.id } }),
      ).resolves.toMatchObject({ userId: user.id, type })
    },
  )

  it("rejects a client-provided owner when creating a habit", async () => {
    const user = await createUser()
    const cookie = await login(user.email)

    const response = await request(app)
      .post("/api/habits")
      .set("Cookie", cookie)
      .send({ name: "Read", type: "BUILD", userId: randomUUID() })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retrieves an owned habit but hides it from another user", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const ownerCookie = await login(owner.email)
    const otherCookie = await login(otherUser.email)
    const habit = await createHabit(owner.id)

    const owned = await request(app)
      .get(`/api/habits/${habit.id}`)
      .set("Cookie", ownerCookie)
    const foreign = await request(app)
      .get(`/api/habits/${habit.id}`)
      .set("Cookie", otherCookie)

    expect(owned.status).toBe(200)
    expect(owned.body.data).toMatchObject({ id: habit.id, name: habit.name })
    expect(owned.body.data).not.toHaveProperty("userId")
    expect(foreign.status).toBe(404)
    expect(foreign.body).toEqual(habitNotFoundResponse)
  })

  it("updates only name and description while preserving type", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id, HabitType.BREAK, "Smoking")

    const response = await request(app)
      .patch(`/api/habits/${habit.id}`)
      .set("Cookie", cookie)
      .send({ name: "  Stop smoking  ", description: "Avoid triggers" })

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      id: habit.id,
      name: "Stop smoking",
      description: "Avoid triggers",
      type: HabitType.BREAK,
    })
    await expect(
      prisma.habit.findUnique({ where: { id: habit.id } }),
    ).resolves.toMatchObject({ userId: owner.id, type: HabitType.BREAK })
  })

  it.each([
    { type: "BREAK" },
    { userId: "another-user" },
    { owner: "another-user" },
    { ownerId: "another-user" },
    { createdAt: "2026-01-01" },
    { id: randomUUID() },
    { habitId: randomUUID() },
  ])("rejects forbidden PATCH fields: %j", async (body) => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id)

    const response = await request(app)
      .patch(`/api/habits/${habit.id}`)
      .set("Cookie", cookie)
      .send(body)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("VALIDATION_ERROR")
  })

  it("rejects an empty PATCH body", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id)

    const response = await request(app)
      .patch(`/api/habits/${habit.id}`)
      .set("Cookie", cookie)
      .send({})

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("VALIDATION_ERROR")
  })

  it("prevents cross-user update and delete", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const otherCookie = await login(otherUser.email)
    const habit = await createHabit(owner.id)

    const update = await request(app)
      .patch(`/api/habits/${habit.id}`)
      .set("Cookie", otherCookie)
      .send({ name: "Changed" })
    const deleteResult = await request(app)
      .delete(`/api/habits/${habit.id}`)
      .set("Cookie", otherCookie)

    expect(update.status).toBe(404)
    expect(update.body).toEqual(habitNotFoundResponse)
    expect(deleteResult.status).toBe(404)
    expect(deleteResult.body).toEqual(habitNotFoundResponse)
    await expect(
      prisma.habit.findUnique({ where: { id: habit.id } }),
    ).resolves.toMatchObject({ id: habit.id, name: "Read", userId: owner.id })
  })

  it("deletes an owned habit and cascades dependent rows", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id)
    const record = await prisma.habitRecord.create({
      data: {
        habitId: habit.id,
        recordDate: new Date("2026-09-08T00:00:00.000Z"),
        status: HabitRecordStatus.SUCCESS,
      },
    })
    const goal = await prisma.goal.create({
      data: { userId: owner.id, habitId: habit.id, title: "Read daily" },
    })

    const response = await request(app)
      .delete(`/api/habits/${habit.id}`)
      .set("Cookie", cookie)

    expect(response.status).toBe(204)
    expect(response.text).toBe("")
    await expect(
      prisma.habit.findUnique({ where: { id: habit.id } }),
    ).resolves.toBeNull()
    await expect(
      prisma.habitRecord.findUnique({ where: { id: record.id } }),
    ).resolves.toBeNull()
    await expect(
      prisma.goal.findUnique({ where: { id: goal.id } }),
    ).resolves.toBeNull()
  })
})
