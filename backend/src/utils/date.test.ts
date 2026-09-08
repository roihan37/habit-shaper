import { describe, expect, it } from "vitest"

import {
  formatCalendarDate,
  formatCalendarDateInTimeZone,
  getCalendarDateInTimeZone,
  getWeekBounds,
  isValidCalendarDate,
  parseCalendarDate,
} from "./date.js"

describe("calendar date utilities", () => {
  it("resolves the calendar date in the requested timezone instead of UTC", () => {
    const instant = new Date("2026-09-08T18:30:00.000Z")

    const jakartaDate = getCalendarDateInTimeZone("Asia/Jakarta", instant)
    const utcDate = getCalendarDateInTimeZone("UTC", instant)

    expect(formatCalendarDate(jakartaDate)).toBe("2026-09-09")
    expect(formatCalendarDate(utcDate)).toBe("2026-09-08")
  })

  it.each(["2026/09/08", "2026-9-8", "2026-02-30", "abc"])(
    "rejects invalid calendar date %s",
    (value) => {
      expect(isValidCalendarDate(value)).toBe(false)
      expect(() => parseCalendarDate(value)).toThrow("Invalid calendar date")
    },
  )

  it("parses a canonical calendar date without timezone shifting", () => {
    expect(formatCalendarDate(parseCalendarDate("2026-09-08"))).toBe(
      "2026-09-08",
    )
  })

  it.each([
    ["Monday", "2026-09-07"],
    ["mid-week", "2026-09-09"],
    ["Sunday", "2026-09-13"],
  ])("calculates Monday-Sunday bounds from %s", (_position, calendarDate) => {
    expect(getWeekBounds(calendarDate)).toEqual({
      start: "2026-09-07",
      end: "2026-09-13",
    })
  })

  it("calculates a week spanning two months", () => {
    expect(getWeekBounds("2026-04-01")).toEqual({
      start: "2026-03-30",
      end: "2026-04-05",
    })
  })

  it("calculates a week spanning two years", () => {
    expect(getWeekBounds("2026-01-01")).toEqual({
      start: "2025-12-29",
      end: "2026-01-04",
    })
  })

  it("converts a habit creation instant to its APP_TIMEZONE date", () => {
    const createdAt = new Date("2026-09-08T18:30:00.000Z")

    expect(
      formatCalendarDateInTimeZone("Asia/Jakarta", createdAt),
    ).toBe("2026-09-09")
  })

  it("uses the timezone calendar date when resolving week boundaries", () => {
    const instant = new Date("2026-09-06T18:30:00.000Z")
    const jakartaDate = formatCalendarDateInTimeZone("Asia/Jakarta", instant)
    const utcDate = formatCalendarDateInTimeZone("UTC", instant)

    expect(jakartaDate).toBe("2026-09-07")
    expect(utcDate).toBe("2026-09-06")
    expect(getWeekBounds(jakartaDate)).toEqual({
      start: "2026-09-07",
      end: "2026-09-13",
    })
    expect(getWeekBounds(utcDate)).toEqual({
      start: "2026-08-31",
      end: "2026-09-06",
    })
  })
})
