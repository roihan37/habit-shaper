function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: "year" | "month" | "day",
) {
  const value = parts.find((part) => part.type === type)?.value

  if (!value) throw new Error(`Unable to resolve calendar date ${type}`)
  return Number(value)
}

export function getCalendarDateInTimeZone(
  timeZone: string,
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)

  return new Date(
    Date.UTC(
      getDatePart(parts, "year"),
      getDatePart(parts, "month") - 1,
      getDatePart(parts, "day"),
    ),
  )
}

export function formatCalendarDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function formatCalendarDateInTimeZone(
  timeZone: string,
  instant: Date,
) {
  return formatCalendarDate(getCalendarDateInTimeZone(timeZone, instant))
}

export function isValidCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return formatCalendarDate(date) === value
}

export function parseCalendarDate(value: string) {
  if (!isValidCalendarDate(value)) throw new Error("Invalid calendar date")

  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function getWeekBounds(calendarDate: string) {
  const date = parseCalendarDate(calendarDate)
  const daysSinceMonday = (date.getUTCDay() + 6) % 7

  date.setUTCDate(date.getUTCDate() - daysSinceMonday)
  const start = formatCalendarDate(date)

  date.setUTCDate(date.getUTCDate() + 6)
  const end = formatCalendarDate(date)

  return { start, end }
}
