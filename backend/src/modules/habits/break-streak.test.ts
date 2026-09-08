import { describe, expect, it } from "vitest"

import { calculateBreakStreak } from "./break-streak.js"

const habitCreationDate = "2026-09-01"
const today = "2026-09-04"

function record(recordDate: string, status: "SUCCESS" | "FAILURE" = "SUCCESS") {
  return { recordDate, status }
}

describe("calculateBreakStreak", () => {
  it("counts one clean day", () => {
    expect(
      calculateBreakStreak({
        habitCreationDate,
        today,
        records: [record(today)],
      }),
    ).toBe(1)
  })

  it("counts multiple consecutive clean days", () => {
    expect(
      calculateBreakStreak({
        habitCreationDate,
        today: "2026-09-03",
        records: [
          record("2026-09-01"),
          record("2026-09-02"),
          record("2026-09-03"),
        ],
      }),
    ).toBe(3)
  })

  it("resets the clean streak when today is a relapse", () => {
    expect(
      calculateBreakStreak({
        habitCreationDate,
        today: "2026-09-03",
        records: [
          record("2026-09-01"),
          record("2026-09-02"),
          record("2026-09-03", "FAILURE"),
        ],
      }),
    ).toBe(0)
  })

  it("starts a new clean streak after a relapse", () => {
    expect(
      calculateBreakStreak({
        habitCreationDate,
        today: "2026-09-03",
        records: [
          record("2026-09-01"),
          record("2026-09-02", "FAILURE"),
          record("2026-09-03"),
        ],
      }),
    ).toBe(1)
  })

  it("continues the new clean streak on the next clean day", () => {
    expect(
      calculateBreakStreak({
        habitCreationDate,
        today,
        records: [
          record("2026-09-01"),
          record("2026-09-02", "FAILURE"),
          record("2026-09-03"),
          record("2026-09-04"),
        ],
      }),
    ).toBe(2)
  })

  it("stops clean-streak continuity at a missing past day", () => {
    expect(
      calculateBreakStreak({
        habitCreationDate,
        today,
        records: [
          record("2026-09-01"),
          record("2026-09-02"),
          record("2026-09-04"),
        ],
      }),
    ).toBe(1)
  })

  it("preserves the previous clean streak while today is pending", () => {
    expect(
      calculateBreakStreak({
        habitCreationDate,
        today,
        records: [
          record("2026-09-01"),
          record("2026-09-02"),
          record("2026-09-03"),
        ],
      }),
    ).toBe(3)
  })

  it("returns zero when there are no records", () => {
    expect(calculateBreakStreak({ habitCreationDate, today, records: [] })).toBe(0)
  })

  it("returns zero when the first tracked day is a relapse", () => {
    expect(
      calculateBreakStreak({
        habitCreationDate,
        today: habitCreationDate,
        records: [record(habitCreationDate, "FAILURE")],
      }),
    ).toBe(0)
  })

  it("ignores records before the habit creation date", () => {
    expect(
      calculateBreakStreak({
        habitCreationDate: "2026-09-03",
        today,
        records: [
          record("2026-09-02", "FAILURE"),
          record("2026-09-03"),
          record("2026-09-04"),
        ],
      }),
    ).toBe(2)
  })

  it("recalculates from corrected historical records", () => {
    const beforeCorrection = [
      record("2026-09-01"),
      record("2026-09-02", "FAILURE"),
      record("2026-09-03"),
    ]
    const afterCorrection = [
      record("2026-09-01"),
      record("2026-09-02"),
      record("2026-09-03"),
    ]

    expect(
      calculateBreakStreak({
        habitCreationDate,
        today: "2026-09-03",
        records: beforeCorrection,
      }),
    ).toBe(1)
    expect(
      calculateBreakStreak({
        habitCreationDate,
        today: "2026-09-03",
        records: afterCorrection,
      }),
    ).toBe(3)
  })
})
