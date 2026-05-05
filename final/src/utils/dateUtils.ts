const dayMs = 24 * 60 * 60 * 1000

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function startOfWeek(date: Date): Date {
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  return addDays(date, mondayOffset)
}

export function getWeekDays(weekStartKey: string): Date[] {
  const start = fromDateKey(weekStartKey)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export function getMonthGrid(dateKey: string): Date[] {
  const target = fromDateKey(dateKey)
  const monthStart = startOfMonth(target)
  const gridStart = startOfWeek(monthStart)
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

export function sameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

export function isSameDateKey(left: Date, rightKey: string): boolean {
  return toDateKey(left) === rightKey
}

export function dateRangeLabel(weekStartKey: string): string {
  const days = getWeekDays(weekStartKey)
  const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
  return `${formatter.format(days[0])} - ${formatter.format(days[6])}`
}

export function monthLabel(dateKey: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(fromDateKey(dateKey))
}

export function diffDays(left: Date, right: Date): number {
  return Math.round((toMidnight(left).getTime() - toMidnight(right).getTime()) / dayMs)
}

function toMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
