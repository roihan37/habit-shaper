import { randomUUID } from "node:crypto"

import bcrypt from "bcrypt"
import request from "supertest"
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { app } from "../../app.js"
import { prisma } from "../../database/prisma.js"
import {
  HabitRecordStatus,
  HabitType,
} from "../../generated/prisma/enums.js"
import { parseCalendarDate } from "../../utils/date.js"

const createdUserIds = new Set<string>()
const fixedNow = new Date("2026-09-09T05:00:00.000Z")

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
  type: HabitType,
  createdAt = new Date("2026-09-01T00:00:00.000Z"),
) {
  return prisma.habit.create({
    data: { userId, name: "Test habit", type, createdAt },
  })
}

function createRecords(
  habitId: string,
  records: Array<{ recordDate: string; status: HabitRecordStatus }>,
) {
  return prisma.habitRecord.createMany({
    data: records.map(({ recordDate, status }) => ({
      habitId,
      recordDate: parseCalendarDate(recordDate),
      status,
    })),
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(fixedNow)
})

afterEach(async () => {
  vi.useRealTimers()
  await cleanUpCreatedUsers()
})

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("GET /api/habits/:habitId/stats", () => {
  it("returns current BUILD streak and partial-week completion statistics", async () => {
    const user = await createUser()
    const cookie = await login(user.email)
    const habit = await createHabit(user.id, HabitType.BUILD)
    await createRecords(habit.id, [
      { recordDate: "2026-09-07", status: HabitRecordStatus.SUCCESS },
      { recordDate: "2026-09-09", status: HabitRecordStatus.SUCCESS },
      { recordDate: "2026-09-10", status: HabitRecordStatus.SUCCESS },
    ])

    const response = await request(app)
      .get(`/api/habits/${habit.id}/stats`)
      .set("Cookie", cookie)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: {
        habitId: habit.id,
        type: HabitType.BUILD,
        currentStreak: 1,
        weekly: {
          weekStart: "2026-09-07",
          weekEnd: "2026-09-13",
          completedDays: 2,
          missedDays: 1,
          eligibleDays: 3,
          completionRate: 66.7,
        },
      },
    })
    expect(typeof response.body.data.weekly.completionRate).toBe("number")
    expect(response.body.data.weekly.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(response.body.data.weekly.weekEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("excludes pre-creation dates and leaves an untracked creation day pending", async () => {
    const user = await createUser()
    const cookie = await login(user.email)
    const habit = await createHabit(
      user.id,
      HabitType.BUILD,
      new Date("2026-09-08T18:30:00.000Z"),
    )

    const response = await request(app)
      .get(`/api/habits/${habit.id}/stats`)
      .set("Cookie", cookie)

    expect(response.status).toBe(200)
    expect(response.body.data.currentStreak).toBe(0)
    expect(response.body.data.weekly).toMatchObject({
      completedDays: 0,
      missedDays: 0,
      eligibleDays: 0,
      completionRate: 0,
    })
  })

  it("returns the current clean streak for an owned BREAK habit", async () => {
    const user = await createUser()
    const cookie = await login(user.email)
    const habit = await createHabit(user.id, HabitType.BREAK)
    await createRecords(habit.id, [
      { recordDate: "2026-09-07", status: HabitRecordStatus.FAILURE },
      { recordDate: "2026-09-08", status: HabitRecordStatus.SUCCESS },
      { recordDate: "2026-09-09", status: HabitRecordStatus.SUCCESS },
    ])

    const response = await request(app)
      .get(`/api/habits/${habit.id}/stats`)
      .set("Cookie", cookie)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: {
        habitId: habit.id,
        type: HabitType.BREAK,
        currentCleanStreak: 2,
      },
    })
  })

  it("resets a BREAK clean streak when today is a relapse", async () => {
    const user = await createUser()
    const cookie = await login(user.email)
    const habit = await createHabit(user.id, HabitType.BREAK)
    await createRecords(habit.id, [
      { recordDate: "2026-09-08", status: HabitRecordStatus.SUCCESS },
      { recordDate: "2026-09-09", status: HabitRecordStatus.FAILURE },
    ])

    const response = await request(app)
      .get(`/api/habits/${habit.id}/stats`)
      .set("Cookie", cookie)

    expect(response.status).toBe(200)
    expect(response.body.data.currentCleanStreak).toBe(0)
  })

  it("hides another user's habit as not found", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const otherCookie = await login(otherUser.email)
    const habit = await createHabit(owner.id, HabitType.BUILD)

    const response = await request(app)
      .get(`/api/habits/${habit.id}/stats`)
      .set("Cookie", otherCookie)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: "HABIT_NOT_FOUND", message: "Habit not found" },
    })
  })

  it("returns the same not-found response for an unknown habit", async () => {
    const user = await createUser()
    const cookie = await login(user.email)

    const response = await request(app)
      .get(`/api/habits/${randomUUID()}/stats`)
      .set("Cookie", cookie)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: "HABIT_NOT_FOUND", message: "Habit not found" },
    })
  })

  it("requires authentication", async () => {
    const response = await request(app).get(
      `/api/habits/${randomUUID()}/stats`,
    )

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED")
  })
})
