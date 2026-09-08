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
import { parseCalendarDate } from "../../utils/date.js"

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

async function createHabitWithHistory(userId: string) {
  const habit = await prisma.habit.create({
    data: { userId, name: "Read", type: HabitType.BUILD },
  })

  await prisma.habitRecord.createMany({
    data: [
      {
        habitId: habit.id,
        recordDate: parseCalendarDate("2020-01-10"),
        status: HabitRecordStatus.SUCCESS,
      },
      {
        habitId: habit.id,
        recordDate: parseCalendarDate("2020-01-01"),
        status: HabitRecordStatus.FAILURE,
      },
      {
        habitId: habit.id,
        recordDate: parseCalendarDate("2020-01-05"),
        status: HabitRecordStatus.SUCCESS,
      },
    ],
  })

  return habit
}

function recordDates(response: request.Response) {
  return response.body.data.map(
    (record: { recordDate: string }) => record.recordDate,
  )
}

afterEach(cleanUpCreatedUsers)

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("GET /api/habits/:habitId/records", () => {
  it("returns the full owned history in ascending date order", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabitWithHistory(owner.id)

    const response = await request(app)
      .get(`/api/habits/${habit.id}/records`)
      .set("Cookie", cookie)

    expect(response.status).toBe(200)
    expect(recordDates(response)).toEqual([
      "2020-01-01",
      "2020-01-05",
      "2020-01-10",
    ])
    for (const record of response.body.data) {
      expect(record.recordDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(record.recordDate).not.toContain("T")
      expect(record).not.toHaveProperty("userId")
    }
  })

  it("supports an inclusive from boundary", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabitWithHistory(owner.id)

    const response = await request(app)
      .get(`/api/habits/${habit.id}/records?from=2020-01-05`)
      .set("Cookie", cookie)

    expect(response.status).toBe(200)
    expect(recordDates(response)).toEqual(["2020-01-05", "2020-01-10"])
  })

  it("supports an inclusive to boundary", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabitWithHistory(owner.id)

    const response = await request(app)
      .get(`/api/habits/${habit.id}/records?to=2020-01-05`)
      .set("Cookie", cookie)

    expect(response.status).toBe(200)
    expect(recordDates(response)).toEqual(["2020-01-01", "2020-01-05"])
  })

  it("supports an inclusive from and to range", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabitWithHistory(owner.id)

    const response = await request(app)
      .get(
        `/api/habits/${habit.id}/records?from=2020-01-02&to=2020-01-09`,
      )
      .set("Cookie", cookie)

    expect(response.status).toBe(200)
    expect(recordDates(response)).toEqual(["2020-01-05"])
  })

  it.each([
    ["from", "2026/09/01"],
    ["from", "2026-9-1"],
    ["from", "2026-02-30"],
    ["to", "abc"],
  ])("rejects invalid %s date %s", async (field, value) => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabitWithHistory(owner.id)

    const response = await request(app)
      .get(`/api/habits/${habit.id}/records`)
      .query({ [field]: value })
      .set("Cookie", cookie)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("VALIDATION_ERROR")
  })

  it("rejects a reversed date range", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabitWithHistory(owner.id)

    const response = await request(app)
      .get(
        `/api/habits/${habit.id}/records?from=2020-01-10&to=2020-01-01`,
      )
      .set("Cookie", cookie)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("VALIDATION_ERROR")
  })

  it("returns an empty collection when no records match", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabitWithHistory(owner.id)

    const response = await request(app)
      .get(`/api/habits/${habit.id}/records?from=2021-01-01`)
      .set("Cookie", cookie)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ data: [] })
  })

  it("returns 404 without leaking a foreign-owned habit's records", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const otherCookie = await login(otherUser.email)
    const habit = await createHabitWithHistory(owner.id)

    const response = await request(app)
      .get(`/api/habits/${habit.id}/records`)
      .set("Cookie", otherCookie)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: "HABIT_NOT_FOUND", message: "Habit not found" },
    })
    expect(response.body).not.toHaveProperty("data")
  })

  it("requires authentication and rejects a client-provided userId", async () => {
    const owner = await createUser()
    const cookie = await login(owner.email)
    const habit = await createHabitWithHistory(owner.id)

    const missingAuth = await request(app).get(
      `/api/habits/${habit.id}/records`,
    )
    const clientUser = await request(app)
      .get(`/api/habits/${habit.id}/records`)
      .query({ userId: owner.id })
      .set("Cookie", cookie)

    expect(missingAuth.status).toBe(401)
    expect(missingAuth.body.error.code).toBe("AUTHENTICATION_REQUIRED")
    expect(clientUser.status).toBe(400)
    expect(clientUser.body.error.code).toBe("VALIDATION_ERROR")
  })
})
