import { describe, expect, it } from "vitest"

import { calculateBuildStreak } from "./build-streak.js"

const habitCreationDate = "2026-09-01"
const today = "2026-09-08"

function record(recordDate: string, status: "SUCCESS" | "FAILURE" = "SUCCESS") {
  return { recordDate, status }
}

describe("calculateBuildStreak", () => {
  it("returns one for a single success today", () => {
    expect(
      calculateBuildStreak({
        habitCreationDate,
        today,
        records: [record(today)],
      }),
    ).toBe(1)
  })

  it("counts consecutive successes through today", () => {
    expect(
      calculateBuildStreak({
        habitCreationDate,
        today,
        records: [
          record("2026-09-06"),
          record("2026-09-07"),
          record("2026-09-08"),
        ],
      }),
    ).toBe(3)
  })

  it("returns zero when today is a failure", () => {
    expect(
      calculateBuildStreak({
        habitCreationDate,
        today,
        records: [record("2026-09-07"), record(today, "FAILURE")],
      }),
    ).toBe(0)
  })

  it("stops at a failure before the current run", () => {
    expect(
      calculateBuildStreak({
        habitCreationDate,
        today,
        records: [
          record("2026-09-05"),
          record("2026-09-06", "FAILURE"),
          record("2026-09-07"),
          record("2026-09-08"),
        ],
      }),
    ).toBe(2)
  })

  it("stops at a missing past date", () => {
    expect(
      calculateBuildStreak({
        habitCreationDate,
        today,
        records: [record("2026-09-06"), record("2026-09-08")],
      }),
    ).toBe(1)
  })

  it("keeps the previous streak while today is untracked", () => {
    expect(
      calculateBuildStreak({
        habitCreationDate,
        today,
        records: [record("2026-09-06"), record("2026-09-07")],
      }),
    ).toBe(2)
  })

  it("recalculates after a historical correction", () => {
    const beforeCorrection = [
      record("2026-09-06", "FAILURE"),
      record("2026-09-07"),
      record("2026-09-08"),
    ]
    const afterCorrection = [
      record("2026-09-06"),
      record("2026-09-07"),
      record("2026-09-08"),
    ]

    expect(
      calculateBuildStreak({ habitCreationDate, today, records: beforeCorrection }),
    ).toBe(2)
    expect(
      calculateBuildStreak({ habitCreationDate, today, records: afterCorrection }),
    ).toBe(3)
  })

  it("excludes dates before habit creation", () => {
    expect(
      calculateBuildStreak({
        habitCreationDate: "2026-09-07",
        today,
        records: [record("2026-09-06", "FAILURE"), record("2026-09-07"), record(today)],
      }),
    ).toBe(2)
  })

  it("returns zero with no records", () => {
    expect(calculateBuildStreak({ habitCreationDate, today, records: [] })).toBe(0)
  })

  it("returns zero when the first tracked day is missing", () => {
    expect(
      calculateBuildStreak({
        habitCreationDate: today,
        today,
        records: [],
      }),
    ).toBe(0)
  })

  it("returns zero when the first tracked record is a failure", () => {
    expect(
      calculateBuildStreak({
        habitCreationDate: today,
        today,
        records: [record(today, "FAILURE")],
      }),
    ).toBe(0)
  })
})
