import { randomUUID } from "node:crypto"

import { afterAll, afterEach, describe, expect, it } from "vitest"

import { prisma } from "../../database/prisma.js"
import {
  HabitRecordStatus,
  HabitType,
} from "../../generated/prisma/enums.js"
import { habitRecordRepository } from "./habit-record.repository.js"

const createdUserIds = new Set<string>()

const date = (value: string) => new Date(`${value}T00:00:00.000Z`)

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

function createHabit(userId: string) {
  return prisma.habit.create({
    data: { userId, name: "Read", type: HabitType.BUILD },
  })
}

function createRecord(
  habitId: string,
  recordDate: Date,
  status: HabitRecordStatus = HabitRecordStatus.SUCCESS,
) {
  return prisma.habitRecord.create({
    data: { habitId, recordDate, status },
  })
}

afterEach(cleanUpCreatedUsers)

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("habitRecordRepository", () => {
  it("finds a record only for the owned habit and matching date", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id)
    const record = await createRecord(habit.id, date("2026-09-05"))

    await expect(
      habitRecordRepository.findByHabitAndDate(
        owner.id,
        habit.id,
        date("2026-09-05"),
      ),
    ).resolves.toMatchObject({ id: record.id })
    await expect(
      habitRecordRepository.findByHabitAndDate(
        owner.id,
        habit.id,
        date("2026-09-06"),
      ),
    ).resolves.toBeNull()
    await expect(
      habitRecordRepository.findByHabitAndDate(
        otherUser.id,
        habit.id,
        date("2026-09-05"),
      ),
    ).resolves.toBeNull()
  })

  it("upserts a new record for an owned habit", async () => {
    const owner = await createUser()
    const habit = await createHabit(owner.id)
    const recordDate = date("2026-09-05")

    const record = await habitRecordRepository.upsertByHabitAndDate(
      owner.id,
      habit.id,
      recordDate,
      HabitRecordStatus.SUCCESS,
    )

    expect(record).toMatchObject({
      habitId: habit.id,
      recordDate,
      status: HabitRecordStatus.SUCCESS,
    })
  })

  it("updates only status and preserves one physical habit/date record", async () => {
    const owner = await createUser()
    const habit = await createHabit(owner.id)
    const recordDate = date("2026-09-05")
    const existing = await createRecord(habit.id, recordDate)

    const updated = await habitRecordRepository.upsertByHabitAndDate(
      owner.id,
      habit.id,
      recordDate,
      HabitRecordStatus.FAILURE,
    )

    expect(updated).toMatchObject({
      id: existing.id,
      habitId: habit.id,
      recordDate,
      status: HabitRecordStatus.FAILURE,
    })
    await expect(
      prisma.habitRecord.count({ where: { habitId: habit.id, recordDate } }),
    ).resolves.toBe(1)
  })

  it("does not create or update records under a foreign-owned habit", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id)
    const recordDate = date("2026-09-05")
    const newRecordDate = date("2026-09-06")
    const existing = await createRecord(habit.id, recordDate)

    const updateResult = await habitRecordRepository.upsertByHabitAndDate(
      otherUser.id,
      habit.id,
      recordDate,
      HabitRecordStatus.FAILURE,
    )
    const createResult = await habitRecordRepository.upsertByHabitAndDate(
      otherUser.id,
      habit.id,
      newRecordDate,
      HabitRecordStatus.FAILURE,
    )

    expect(updateResult).toBeNull()
    expect(createResult).toBeNull()
    await expect(
      prisma.habitRecord.findUnique({ where: { id: existing.id } }),
    ).resolves.toMatchObject({ status: HabitRecordStatus.SUCCESS })
    await expect(
      prisma.habitRecord.count({ where: { habitId: habit.id, recordDate } }),
    ).resolves.toBe(1)
    await expect(
      prisma.habitRecord.count({
        where: { habitId: habit.id, recordDate: newRecordDate },
      }),
    ).resolves.toBe(0)
  })

  it("returns an owned date range in ascending date order", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id)
    await createRecord(habit.id, date("2026-09-07"))
    await createRecord(habit.id, date("2026-09-03"))
    await createRecord(habit.id, date("2026-09-05"))

    const records = await habitRecordRepository.findByDateRange(
      owner.id,
      habit.id,
      date("2026-09-04"),
      date("2026-09-07"),
    )
    const foreignRecords = await habitRecordRepository.findByDateRange(
      otherUser.id,
      habit.id,
      date("2026-09-01"),
      date("2026-09-30"),
    )

    expect(records.map((record) => record.recordDate)).toEqual([
      date("2026-09-05"),
      date("2026-09-07"),
    ])
    expect(foreignRecords).toEqual([])
  })

  it("returns owned history deterministically in ascending date order", async () => {
    const owner = await createUser()
    const otherUser = await createUser()
    const habit = await createHabit(owner.id)
    await createRecord(habit.id, date("2026-09-07"))
    await createRecord(habit.id, date("2026-09-03"))
    await createRecord(habit.id, date("2026-09-05"))

    const records = await habitRecordRepository.findHistory(owner.id, habit.id)
    const foreignRecords = await habitRecordRepository.findHistory(
      otherUser.id,
      habit.id,
    )

    expect(records.map((record) => record.recordDate)).toEqual([
      date("2026-09-03"),
      date("2026-09-05"),
      date("2026-09-07"),
    ])
    expect(foreignRecords).toEqual([])
  })
})
