import { describe, expect, it } from "vitest"

import {
  formatCalendarDate,
  getCalendarDateInTimeZone,
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
})
