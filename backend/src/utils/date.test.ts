import { describe, expect, it } from "vitest"

import {
  formatCalendarDate,
  getCalendarDateInTimeZone,
} from "./date.js"

describe("calendar date utilities", () => {
  it("resolves the calendar date in the requested timezone instead of UTC", () => {
    const instant = new Date("2026-09-08T18:30:00.000Z")

    const jakartaDate = getCalendarDateInTimeZone("Asia/Jakarta", instant)
    const utcDate = getCalendarDateInTimeZone("UTC", instant)

    expect(formatCalendarDate(jakartaDate)).toBe("2026-09-09")
    expect(formatCalendarDate(utcDate)).toBe("2026-09-08")
  })
})
