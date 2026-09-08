import { randomUUID } from "node:crypto"

import bcrypt from "bcrypt"
import request from "supertest"
import { afterAll, afterEach, describe, expect, it } from "vitest"

import { app } from "../../app.js"
import { env } from "../../config/env.js"
import { prisma } from "../../database/prisma.js"
import {
  HabitRecordStatus,
  HabitType,
} from "../../generated/prisma/enums.js"
import {
  formatCalendarDate,
  getCalendarDateInTimeZone,
} from "../../utils/date.js"

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

function createHabit(userId: string) {
  return prisma.habit.create({
    data: { userId, name: "Read", type: HabitType.BUILD },
  })
}

afterEach(cleanUpCreatedUsers)

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("PUT /api/habits/:habitId/today", () => {
  it("creates and then updates today's record without a duplicate row", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id)
    const expectedDate = getCalendarDateInTimeZone(env.APP_TIMEZONE)

    const created = await request(app)
      .put(`/api/habits/${habit.id}/today`)
      .set("Cookie", cookie)
      .send({ status: HabitRecordStatus.SUCCESS })
    const updated = await request(app)
      .put(`/api/habits/${habit.id}/today`)
      .set("Cookie", cookie)
      .send({ status: HabitRecordStatus.FAILURE })

    expect(created.status).toBe(200)
    expect(created.body.data).toMatchObject({
      habitId: habit.id,
      recordDate: formatCalendarDate(expectedDate),
      status: HabitRecordStatus.SUCCESS,
    })
    expect(updated.status).toBe(200)
    expect(updated.body.data).toMatchObject({
      id: created.body.data.id,
      habitId: habit.id,
      recordDate: formatCalendarDate(expectedDate),
      status: HabitRecordStatus.FAILURE,
    })
    expect(updated.body.data).not.toHaveProperty("userId")
    await expect(
      prisma.habitRecord.count({
        where: { habitId: habit.id, recordDate: expectedDate },
      }),
    ).resolves.toBe(1)
  })

  it("accepts both SUCCESS and FAILURE statuses", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const successHabit = await createHabit(owner.id)
    const failureHabit = await createHabit(owner.id)

    const success = await request(app)
      .put(`/api/habits/${successHabit.id}/today`)
      .set("Cookie", cookie)
      .send({ status: "SUCCESS" })
    const failure = await request(app)
      .put(`/api/habits/${failureHabit.id}/today`)
      .set("Cookie", cookie)
      .send({ status: "FAILURE" })

    expect(success.status).toBe(200)
    expect(success.body.data.status).toBe("SUCCESS")
    expect(failure.status).toBe(200)
    expect(failure.body.data.status).toBe("FAILURE")
  })

  it("returns 404 and does not change a foreign-owned habit record", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const otherCookie = await login(otherUser.email)
    const habit = await createHabit(owner.id)
    const recordDate = getCalendarDateInTimeZone(env.APP_TIMEZONE)
    const existing = await prisma.habitRecord.create({
      data: {
        habitId: habit.id,
        recordDate,
        status: HabitRecordStatus.SUCCESS,
      },
    })

    const response = await request(app)
      .put(`/api/habits/${habit.id}/today`)
      .set("Cookie", otherCookie)
      .send({ status: HabitRecordStatus.FAILURE })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: "HABIT_NOT_FOUND", message: "Habit not found" },
    })
    await expect(
      prisma.habitRecord.findUnique({ where: { id: existing.id } }),
    ).resolves.toMatchObject({ status: HabitRecordStatus.SUCCESS })
    await expect(
      prisma.habitRecord.count({ where: { habitId: habit.id, recordDate } }),
    ).resolves.toBe(1)
  })

  it.each(["COMPLETED", "MISSED", "CLEAN", "RELAPSE", "DONE", "INVALID"])(
    "rejects invalid status %s",
    async (status) => {
      const owner = await createUser()
      const cookie = await login(owner.email)
      const habit = await createHabit(owner.id)

      const response = await request(app)
        .put(`/api/habits/${habit.id}/today`)
        .set("Cookie", cookie)
        .send({ status })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("VALIDATION_ERROR")
    },
  )

  it.each([
    { status: "SUCCESS", recordDate: "2026-09-08" },
    { status: "SUCCESS", userId: randomUUID() },
  ])("rejects client-controlled tracking fields: %j", async (body) => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id)

    const response = await request(app)
      .put(`/api/habits/${habit.id}/today`)
      .set("Cookie", cookie)
      .send(body)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("VALIDATION_ERROR")
    await expect(
      prisma.habitRecord.count({ where: { habitId: habit.id } }),
    ).resolves.toBe(0)
  })

  it("requires authentication", async () => {
    const response = await request(app)
      .put(`/api/habits/${randomUUID()}/today`)
      .send({ status: "SUCCESS" })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED")
  })
})
