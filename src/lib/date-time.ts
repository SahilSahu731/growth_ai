export function safeLocale(locale?: string) {
  if (!locale) return "en"
  try {
    new Intl.DateTimeFormat(locale).format()
    return locale
  } catch {
    return "en"
  }
}

export function dateKeyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function addDateDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function localDateStartUtc(dateKey: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const desired = Date.UTC(year, month - 1, day)
  let estimate = desired
  for (let pass = 0; pass < 3; pass += 1) {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(estimate))
    const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value)
    const rendered = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"))
    estimate += desired - rendered
  }
  return new Date(estimate)
}

export function sevenDayWindowStart(timeZone: string, now = new Date()) {
  return localDateStartUtc(addDateDays(dateKeyInTimeZone(now, timeZone), -6), timeZone)
}

export function formatDateOnly(value: string, locale?: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(safeLocale(locale), { ...options, timeZone: "UTC" }).format(new Date(`${value}T12:00:00.000Z`))
}
