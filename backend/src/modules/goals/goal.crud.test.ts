import { randomUUID } from "node:crypto"

import bcrypt from "bcrypt"
import request from "supertest"
import { afterAll, afterEach, describe, expect, it } from "vitest"

import { app } from "../../app.js"
import { prisma } from "../../database/prisma.js"
import { HabitType } from "../../generated/prisma/enums.js"

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

function createHabit(userId: string, name = "Read") {
  return prisma.habit.create({
    data: { userId, name, type: HabitType.BUILD },
  })
}

function createGoal(userId: string, habitId: string, title = "Read daily") {
  return prisma.goal.create({ data: { userId, habitId, title } })
}

const habitNotFoundResponse = {
  error: { code: "HABIT_NOT_FOUND", message: "Habit not found" },
}
const goalNotFoundResponse = {
  error: { code: "GOAL_NOT_FOUND", message: "Goal not found" },
}

afterEach(cleanUpCreatedUsers)

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("Goal CRUD", () => {
  it("requires authentication for every goal endpoint", async () => {
    const goalId = randomUUID()
    const habitId = randomUUID()
    const responses = await Promise.all([
      request(app).get("/api/goals"),
      request(app).post("/api/goals").send({ habitId, title: "Read" }),
      request(app).patch(`/api/goals/${goalId}`).send({ title: "Updated" }),
      request(app).delete(`/api/goals/${goalId}`),
    ])

    for (const response of responses) {
      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED")
    }
  })

  it("creates a goal linked to an owned habit using the authenticated owner", async () => {
    const user = await createUser()
    const cookie = await login(user.email)
    const habit = await createHabit(user.id)

    const response = await request(app)
      .post("/api/goals")
      .set("Cookie", cookie)
      .send({
        habitId: habit.id,
        title: "  Read consistently  ",
        description: "One chapter every day",
      })

    expect(response.status).toBe(201)
    expect(response.body.data).toMatchObject({
      habitId: habit.id,
      title: "Read consistently",
      description: "One chapter every day",
    })
    expect(response.body.data).not.toHaveProperty("userId")
    await expect(
      prisma.goal.findUnique({ where: { id: response.body.data.id } }),
    ).resolves.toMatchObject({ userId: user.id, habitId: habit.id })
  })

  it("rejects a foreign or nonexistent linked habit without creating a goal", async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const cookie = await login(user.email)
    const foreignHabit = await createHabit(otherUser.id)

    for (const habitId of [foreignHabit.id, randomUUID()]) {
      const response = await request(app)
        .post("/api/goals")
        .set("Cookie", cookie)
        .send({ habitId, title: "Forbidden goal" })

      expect(response.status).toBe(404)
      expect(response.body).toEqual(habitNotFoundResponse)
    }
    await expect(
      prisma.goal.count({ where: { userId: user.id } }),
    ).resolves.toBe(0)
  })

  it("lists only the current user's goals and supports the owned habit filter", async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const cookie = await login(user.email)
    const habitA = await createHabit(user.id, "Read")
    const habitB = await createHabit(user.id, "Exercise")
    const foreignHabit = await createHabit(otherUser.id)
    const goalA = await createGoal(user.id, habitA.id, "Read daily")
    const goalB = await createGoal(user.id, habitB.id, "Exercise daily")
    await createGoal(otherUser.id, foreignHabit.id, "Foreign goal")

    const all = await request(app).get("/api/goals").set("Cookie", cookie)
    const filtered = await request(app)
      .get(`/api/goals?habitId=${habitA.id}`)
      .set("Cookie", cookie)

    expect(all.status).toBe(200)
    expect(all.body.data.map((goal: { id: string }) => goal.id)).toEqual(
      expect.arrayContaining([goalA.id, goalB.id]),
    )
    expect(all.body.data).toHaveLength(2)
    expect(all.body.data.every((goal: object) => !("userId" in goal))).toBe(true)
    expect(filtered.body.data).toEqual([
      expect.objectContaining({ id: goalA.id, habitId: habitA.id }),
    ])
  })

  it("updates a goal to another owned habit", async () => {
    const user = await createUser()
    const cookie = await login(user.email)
    const habitA = await createHabit(user.id, "Read")
    const habitB = await createHabit(user.id, "Exercise")
    const goal = await createGoal(user.id, habitA.id)

    const response = await request(app)
      .patch(`/api/goals/${goal.id}`)
      .set("Cookie", cookie)
      .send({
        habitId: habitB.id,
        title: "Exercise consistently",
        description: "Every morning",
      })

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      id: goal.id,
      habitId: habitB.id,
      title: "Exercise consistently",
      description: "Every morning",
    })
    expect(response.body.data).not.toHaveProperty("userId")
  })

  it("rejects relinking to a foreign habit and preserves the original link", async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const cookie = await login(user.email)
    const ownedHabit = await createHabit(user.id)
    const foreignHabit = await createHabit(otherUser.id)
    const goal = await createGoal(user.id, ownedHabit.id)

    const response = await request(app)
      .patch(`/api/goals/${goal.id}`)
      .set("Cookie", cookie)
      .send({ habitId: foreignHabit.id })

    expect(response.status).toBe(404)
    expect(response.body).toEqual(habitNotFoundResponse)
    await expect(
      prisma.goal.findUnique({ where: { id: goal.id } }),
    ).resolves.toMatchObject({ habitId: ownedHabit.id })
  })

  it("keeps a foreign-owned goal inaccessible to PATCH and DELETE", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const otherCookie = await login(otherUser.email)
    const habit = await createHabit(owner.id)
    const goal = await createGoal(owner.id, habit.id)

    const update = await request(app)
      .patch(`/api/goals/${goal.id}`)
      .set("Cookie", otherCookie)
      .send({ title: "Changed" })
    const deletion = await request(app)
      .delete(`/api/goals/${goal.id}`)
      .set("Cookie", otherCookie)

    expect(update.status).toBe(404)
    expect(update.body).toEqual(goalNotFoundResponse)
    expect(deletion.status).toBe(404)
    expect(deletion.body).toEqual(goalNotFoundResponse)
    await expect(
      prisma.goal.findUnique({ where: { id: goal.id } }),
    ).resolves.toMatchObject({ title: "Read daily", userId: owner.id })
  })

  it("deletes an owned goal with no response body", async () => {
    const user = await createUser()
    const cookie = await login(user.email)
    const habit = await createHabit(user.id)
    const goal = await createGoal(user.id, habit.id)

    const response = await request(app)
      .delete(`/api/goals/${goal.id}`)
      .set("Cookie", cookie)

    expect(response.status).toBe(204)
    expect(response.text).toBe("")
    await expect(
      prisma.goal.findUnique({ where: { id: goal.id } }),
    ).resolves.toBeNull()
  })

  it("rejects forbidden fields and empty updates", async () => {
    const user = await createUser()
    const cookie = await login(user.email)
    const habit = await createHabit(user.id)
    const goal = await createGoal(user.id, habit.id)

    const createWithOwner = await request(app)
      .post("/api/goals")
      .set("Cookie", cookie)
      .send({ habitId: habit.id, title: "Goal", userId: user.id })
    const emptyUpdate = await request(app)
      .patch(`/api/goals/${goal.id}`)
      .set("Cookie", cookie)
      .send({})
    const systemFieldUpdate = await request(app)
      .patch(`/api/goals/${goal.id}`)
      .set("Cookie", cookie)
      .send({ createdAt: "2026-01-01" })

    for (const response of [createWithOwner, emptyUpdate, systemFieldUpdate]) {
      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("VALIDATION_ERROR")
    }
  })
})
