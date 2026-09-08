import { describe, expect, it } from "vitest"

import { calculateBuildWeeklyCompletion } from "./build-weekly-completion.js"

const historicalWeek = {
  habitCreationDate: "2026-08-01",
  weekStart: "2026-09-07",
  weekEnd: "2026-09-13",
  today: "2026-09-20",
}

function record(recordDate: string, status: "SUCCESS" | "FAILURE" = "SUCCESS") {
  return { recordDate, status }
}

describe("calculateBuildWeeklyCompletion", () => {
  it("calculates a historical full week", () => {
    const result = calculateBuildWeeklyCompletion({
      ...historicalWeek,
      records: [
        record("2026-09-07"),
        record("2026-09-08"),
        record("2026-09-10", "FAILURE"),
        record("2026-09-11"),
        record("2026-09-12"),
        record("2026-09-13"),
      ],
    })

    expect(result).toEqual({
      completedDays: 5,
      missedDays: 2,
      eligibleDays: 7,
      completionRate: 71.4,
    })
  })

  it("calculates only elapsed evaluated days in the current partial week", () => {
    const result = calculateBuildWeeklyCompletion({
      habitCreationDate: "2026-08-01",
      weekStart: "2026-09-07",
      weekEnd: "2026-09-13",
      today: "2026-09-09",
      records: [record("2026-09-07")],
    })

    expect(result).toEqual({
      completedDays: 1,
      missedDays: 1,
      eligibleDays: 2,
      completionRate: 50,
    })
  })

  it("counts a missing past eligible day as missed", () => {
    const result = calculateBuildWeeklyCompletion({
      ...historicalWeek,
      habitCreationDate: "2026-09-11",
      records: [record("2026-09-11"), record("2026-09-13")],
    })

    expect(result).toEqual({
      completedDays: 2,
      missedDays: 1,
      eligibleDays: 3,
      completionRate: 66.7,
    })
  })

  it("excludes dates before habit creation from eligible and missed days", () => {
    const result = calculateBuildWeeklyCompletion({
      ...historicalWeek,
      habitCreationDate: "2026-09-09",
      records: [
        record("2026-09-07", "FAILURE"),
        record("2026-09-08", "FAILURE"),
        record("2026-09-09"),
        record("2026-09-10", "FAILURE"),
      ],
    })

    expect(result).toEqual({
      completedDays: 1,
      missedDays: 4,
      eligibleDays: 5,
      completionRate: 20,
    })
  })

  it("excludes an untracked today as pending", () => {
    const result = calculateBuildWeeklyCompletion({
      habitCreationDate: "2026-09-07",
      weekStart: "2026-09-07",
      weekEnd: "2026-09-13",
      today: "2026-09-09",
      records: [record("2026-09-07"), record("2026-09-08")],
    })

    expect(result).toEqual({
      completedDays: 2,
      missedDays: 0,
      eligibleDays: 2,
      completionRate: 100,
    })
  })

  it("returns zero safely when there are no eligible days", () => {
    const result = calculateBuildWeeklyCompletion({
      habitCreationDate: "2026-09-09",
      weekStart: "2026-09-07",
      weekEnd: "2026-09-13",
      today: "2026-09-09",
      records: [],
    })

    expect(result).toEqual({
      completedDays: 0,
      missedDays: 0,
      eligibleDays: 0,
      completionRate: 0,
    })
  })

  it("rounds two of three eligible days to numeric 66.7", () => {
    const result = calculateBuildWeeklyCompletion({
      ...historicalWeek,
      habitCreationDate: "2026-09-11",
      records: [record("2026-09-11"), record("2026-09-12")],
    })

    expect(result.completionRate).toBe(66.7)
    expect(typeof result.completionRate).toBe("number")
    expect(result.completionRate).not.toBe("66.7%")
  })

  it.each([
    ["SUCCESS", 1, 0, 100],
    ["FAILURE", 0, 1, 0],
  ] as const)(
    "counts today's explicit %s record as eligible",
    (status, completedDays, missedDays, completionRate) => {
      expect(
        calculateBuildWeeklyCompletion({
          habitCreationDate: "2026-09-09",
          weekStart: "2026-09-07",
          weekEnd: "2026-09-13",
          today: "2026-09-09",
          records: [record("2026-09-09", status)],
        }),
      ).toEqual({
        completedDays,
        missedDays,
        eligibleDays: 1,
        completionRate,
      })
    },
  )

  it("recalculates from corrected historical records", () => {
    const before = calculateBuildWeeklyCompletion({
      ...historicalWeek,
      habitCreationDate: "2026-09-11",
      records: [record("2026-09-11", "FAILURE")],
    })
    const after = calculateBuildWeeklyCompletion({
      ...historicalWeek,
      habitCreationDate: "2026-09-11",
      records: [
        record("2026-09-11"),
        record("2026-09-12"),
        record("2026-09-13"),
      ],
    })

    expect(before.completionRate).toBe(0)
    expect(after.completionRate).toBe(100)
  })
})
