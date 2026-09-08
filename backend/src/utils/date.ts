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
