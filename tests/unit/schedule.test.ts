import { describe, expect, it } from 'vitest'
import { dateKey, daysInMonth, getWeekDates, isHabitDueOnDate } from '../../src/domain/schedule'
import type { Habit } from '../../src/domain/types'

const habit = (scheduleType: Habit['scheduleType'], scheduleConfig: Habit['scheduleConfig'] = {}, createdAt = ''): Habit => ({
  id: 'test', name: '测试', icon: '🌱', color: '#fff', context: '全天', scheduleType, scheduleConfig,
  enabled: true, createdAt, updatedAt: '',
})

describe('schedule rules', () => {
  it('formats local dates without UTC shifting', () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })

  it('matches daily, weekday and monthly schedules', () => {
    const monday = new Date(2026, 0, 5)
    expect(isHabitDueOnDate(habit('daily'), monday)).toBe(true)
    expect(isHabitDueOnDate(habit('weeklyDays', { weekdays: [1] }), monday)).toBe(true)
    expect(isHabitDueOnDate(habit('weeklyDays', { weekdays: [2] }), monday)).toBe(false)
    expect(isHabitDueOnDate(habit('monthlyDate', { day: 31 }), new Date(2026, 1, 28))).toBe(true)
    expect(isHabitDueOnDate(habit('weeklyCount', { count: 2 }), monday, 1)).toBe(true)
    expect(isHabitDueOnDate(habit('weeklyCount', { count: 2 }), monday, 2)).toBe(false)
    expect(isHabitDueOnDate(habit('yearlyCount', { count: 1 }), monday, 0)).toBe(true)
    expect(isHabitDueOnDate(habit('yearlyCount', { count: 1 }), monday, 1)).toBe(false)
  })

  it('keeps interval-month habits due until the next interval', () => {
    const created = '2026-01-15T08:00:00.000Z'
    expect(isHabitDueOnDate(habit('intervalMonths', { intervalMonths: 3, day: 15 }, created), new Date(2026, 0, 14))).toBe(false)
    expect(isHabitDueOnDate(habit('intervalMonths', { intervalMonths: 3, day: 15 }, created), new Date(2026, 0, 15))).toBe(true)
    expect(isHabitDueOnDate(habit('intervalMonths', { intervalMonths: 3, day: 15 }, created), new Date(2026, 2, 20))).toBe(true)
    expect(isHabitDueOnDate(habit('intervalMonths', { intervalMonths: 3, day: 15 }, created), new Date(2026, 3, 14))).toBe(false)
    expect(isHabitDueOnDate(habit('intervalMonths', { intervalMonths: 3, day: 15 }, created), new Date(2026, 3, 15))).toBe(true)
  })

  it('returns a Monday-to-Sunday week', () => {
    expect(getWeekDates(new Date(2026, 0, 7)).map(dateKey)).toEqual(['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10', '2026-01-11'])
  })

  it('handles leap years', () => {
    expect(daysInMonth(2028, 1)).toBe(29)
    expect(daysInMonth(2026, 1)).toBe(28)
  })
})
