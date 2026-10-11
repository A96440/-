import type { Habit } from './types'

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function isHabitDueOnDate(habit: Habit, date: Date, completedInPeriod = 0): boolean {
  if (!habit.enabled) return false
  const config = habit.scheduleConfig
  if (habit.scheduleType === 'daily') return true
  if (habit.scheduleType === 'weeklyCount' || habit.scheduleType === 'monthlyCount') return completedInPeriod < (config.count ?? 1)
  if (habit.scheduleType === 'weeklyDays') return config.weekdays?.includes(date.getDay()) ?? false
  const requestedDay = config.day ?? 1
  return date.getDate() === Math.min(requestedDay, daysInMonth(date.getFullYear(), date.getMonth()))
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}

export function getWeekDates(date: Date): Date[] {
  const first = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + index))
}

export function getMonthDates(date: Date): Date[] {
  const total = daysInMonth(date.getFullYear(), date.getMonth())
  return Array.from({ length: total }, (_, index) => new Date(date.getFullYear(), date.getMonth(), index + 1))
}
