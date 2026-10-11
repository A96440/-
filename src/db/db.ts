import Dexie, { type Table } from 'dexie'
import type { AppSetting, CheckRecord, Habit } from '../domain/types'

export const DATABASE_SCHEMA_VERSION = 1

export class XiaoriziDatabase extends Dexie {
  habits!: Table<Habit, string>
  checkRecords!: Table<CheckRecord, string>
  settings!: Table<AppSetting, string>

  constructor() {
    super('xiaorizi-private')
    this.version(DATABASE_SCHEMA_VERSION).stores({
      habits: 'id, enabled, context, createdAt',
      checkRecords: 'id, [habitId+date], habitId, date',
      settings: 'key',
    })
  }
}

export const db = new XiaoriziDatabase()
