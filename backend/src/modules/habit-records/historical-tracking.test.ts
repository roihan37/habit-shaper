import { randomUUID } from "node:crypto"

import bcrypt from "bcrypt"
import request from "supertest"
import { afterAll, afterEach, describe, expect, it } from "vitest"

import { app } from "../../app.js"
import { env } from "../../config/env.js"
import { prisma } from "../../database/prisma.js"
import { HabitType } from "../../generated/prisma/enums.js"
import {
  formatCalendarDate,
  getCalendarDateInTimeZone,
  parseCalendarDate,
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

function createHabit(userId: string, createdAt = new Date("2020-01-01T00:00:00Z")) {
  return prisma.habit.create({
    data: {
      userId,
      name: "Read",
      type: HabitType.BUILD,
      createdAt,
    },
  })
}

function addCalendarDays(value: string, days: number) {
  const result = parseCalendarDate(value)
  result.setUTCDate(result.getUTCDate() + days)
  return formatCalendarDate(result)
}

function trackHistorical(
  habitId: string,
  recordDate: string,
  cookie: string,
  status = "SUCCESS",
) {
  return request(app)
    .put(`/api/habits/${habitId}/records/${recordDate}`)
    .set("Cookie", cookie)
    .send({ status })
}

afterEach(cleanUpCreatedUsers)

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("PUT /api/habits/:habitId/records/:date", () => {
  it("creates a valid historical record with a normalized date", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id)

    const response = await trackHistorical(habit.id, "2020-01-05", cookie)

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      habitId: habit.id,
      recordDate: "2020-01-05",
      status: "SUCCESS",
    })
    expect(response.body.data.recordDate).not.toContain("T")
  })

  it("allows the habit creation calendar date", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id, new Date("2020-01-05T00:00:00Z"))

    const response = await trackHistorical(habit.id, "2020-01-05", cookie)

    expect(response.status).toBe(200)
    expect(response.body.data.recordDate).toBe("2020-01-05")
  })

  it("rejects a date before the habit creation calendar date", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id, new Date("2020-01-05T00:00:00Z"))

    const response = await trackHistorical(habit.id, "2020-01-04", cookie)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: {
        code: "INVALID_RECORD_DATE",
        message: "Record date cannot be earlier than the habit creation date",
      },
    })
  })

  it("derives the creation boundary using APP_TIMEZONE", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id, new Date("2020-09-01T18:30:00Z"))

    const beforeCreation = await trackHistorical(habit.id, "2020-09-01", cookie)
    const creationDate = await trackHistorical(habit.id, "2020-09-02", cookie)

    expect(env.APP_TIMEZONE).toBe("Asia/Jakarta")
    expect(beforeCreation.status).toBe(400)
    expect(beforeCreation.body.error.code).toBe("INVALID_RECORD_DATE")
    expect(creationDate.status).toBe(200)
    expect(creationDate.body.data.recordDate).toBe("2020-09-02")
  })

  it("rejects a future date and allows today in APP_TIMEZONE", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id)
    const today = formatCalendarDate(
      getCalendarDateInTimeZone(env.APP_TIMEZONE),
    )
    const tomorrow = addCalendarDays(today, 1)

    const future = await trackHistorical(habit.id, tomorrow, cookie)
    const todayResult = await trackHistorical(habit.id, today, cookie)

    expect(future.status).toBe(400)
    expect(future.body).toEqual({
      error: {
        code: "FUTURE_DATE_NOT_ALLOWED",
        message: "Habit records cannot be created for future dates",
      },
    })
    expect(todayResult.status).toBe(200)
    expect(todayResult.body.data.recordDate).toBe(today)
  })

  it.each(["2026%2F09%2F08", "2026-9-8", "abc", "2026-02-30"])(
    "rejects invalid calendar date %s",
    async (recordDate) => {
      const owner = await createUser()
      const cookie = await login(owner.email)
      const habit = await createHabit(owner.id)

      const response = await trackHistorical(habit.id, recordDate, cookie)

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("VALIDATION_ERROR")
    },
  )

  it("rejects invalid status and client-controlled record fields", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id)

    const invalidStatus = await trackHistorical(
      habit.id,
      "2020-01-05",
      cookie,
      "DONE",
    )
    const clientDate = await request(app)
      .put(`/api/habits/${habit.id}/records/2020-01-05`)
      .set("Cookie", cookie)
      .send({ status: "SUCCESS", recordDate: "2020-01-06" })
    const clientUser = await request(app)
      .put(`/api/habits/${habit.id}/records/2020-01-05`)
      .set("Cookie", cookie)
      .send({ status: "SUCCESS", userId: randomUUID() })

    expect(invalidStatus.status).toBe(400)
    expect(invalidStatus.body.error.code).toBe("VALIDATION_ERROR")
    expect(clientDate.status).toBe(400)
    expect(clientDate.body.error.code).toBe("VALIDATION_ERROR")
    expect(clientUser.status).toBe(400)
    expect(clientUser.body.error.code).toBe("VALIDATION_ERROR")
  })

  it("requires authentication", async () => {
    const response = await request(app)
      .put(`/api/habits/${randomUUID()}/records/2020-01-05`)
      .send({ status: "SUCCESS" })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED")
  })

  it("returns 404 and performs no write for a foreign-owned habit", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const otherCookie = await login(otherUser.email)
    const habit = await createHabit(owner.id)

    const response = await trackHistorical(
      habit.id,
      "2020-01-05",
      otherCookie,
    )

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: "HABIT_NOT_FOUND", message: "Habit not found" },
    })
    await expect(
      prisma.habitRecord.count({ where: { habitId: habit.id } }),
    ).resolves.toBe(0)
  })

  it("upserts the same historical row without creating duplicates", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabit(owner.id)

    const created = await trackHistorical(habit.id, "2020-01-05", cookie)
    const updated = await trackHistorical(
      habit.id,
      "2020-01-05",
      cookie,
      "FAILURE",
    )

    expect(created.status).toBe(200)
    expect(updated.status).toBe(200)
    expect(updated.body.data).toMatchObject({
      id: created.body.data.id,
      recordDate: "2020-01-05",
      status: "FAILURE",
    })
    await expect(
      prisma.habitRecord.count({
        where: { habitId: habit.id, recordDate: parseCalendarDate("2020-01-05") },
      }),
    ).resolves.toBe(1)
  })
})
