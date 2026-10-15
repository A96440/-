import Dexie, { type Table } from 'dexie'
import type { AppSetting, Birthday, CheckRecord, Habit, LifeItem, Memo, Project, ProjectNode, QuantityRecord } from '../domain/types'

export const DATABASE_SCHEMA_VERSION = 3

export class XiaoriziDatabase extends Dexie {
  habits!: Table<Habit, string>
  checkRecords!: Table<CheckRecord, string>
  quantityRecords!: Table<QuantityRecord, string>
  projects!: Table<Project, string>
  projectNodes!: Table<ProjectNode, string>
  lifeItems!: Table<LifeItem, string>
  memos!: Table<Memo, string>
  birthdays!: Table<Birthday, string>
  settings!: Table<AppSetting, string>

  constructor() {
    super('xiaorizi-private')
    this.version(DATABASE_SCHEMA_VERSION).stores({
      habits: 'id, enabled, context, createdAt',
      checkRecords: 'id, [habitId+date], habitId, date',
      quantityRecords: 'id, [habitId+date], habitId, date',
      projects: 'id, status, updatedAt, createdAt',
      projectNodes: 'id, projectId, status, position, updatedAt',
      lifeItems: 'id, status, dueAt, updatedAt, createdAt',
      memos: 'id, status, pinned, updatedAt, createdAt',
      birthdays: 'id, month, day, updatedAt, createdAt',
      settings: 'key',
    })
  }
}

export const db = new XiaoriziDatabase()
