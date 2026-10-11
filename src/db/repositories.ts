import { db } from './db'
import type { CheckRecord, Habit } from '../domain/types'
import { dateKey } from '../domain/schedule'

const newId = () => crypto.randomUUID()

export async function listHabits(includeDisabled = true): Promise<Habit[]> {
  const habits = await db.habits.orderBy('createdAt').toArray()
  return includeDisabled ? habits : habits.filter((habit) => habit.enabled)
}

export async function saveHabit(habit: Habit): Promise<void> {
  await db.habits.put(habit)
}

export async function setHabitEnabled(id: string, enabled: boolean): Promise<void> {
  await db.habits.update(id, { enabled, updatedAt: new Date().toISOString() })
}

export async function createHabit(input: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
  const now = new Date().toISOString()
  const habit: Habit = { ...input, id: newId(), createdAt: now, updatedAt: now }
  await saveHabit(habit)
  return habit
}

export async function deleteHabit(id: string): Promise<void> {
  await db.transaction('rw', db.habits, db.checkRecords, async () => {
    await db.habits.delete(id)
    await db.checkRecords.where('habitId').equals(id).delete()
  })
}

export async function setCheck(habitId: string, date = new Date(), completed: boolean): Promise<CheckRecord> {
  const key = dateKey(date)
  const existing = await db.checkRecords.where('[habitId+date]').equals([habitId, key]).first()
  const record: CheckRecord = { id: existing?.id ?? newId(), habitId, date: key, completed, completedAt: completed ? new Date().toISOString() : undefined }
  await db.checkRecords.put(record)
  return record
}

export async function getChecksForDates(start: Date, end: Date): Promise<CheckRecord[]> {
  return db.checkRecords.where('date').between(dateKey(start), dateKey(end), true, true).toArray()
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const setting = await db.settings.get(key)
  return (setting?.value as T | undefined) ?? fallback
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value })
}
