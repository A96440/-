import { db } from './db'
import type { Birthday, CheckRecord, Habit, LifeItem, Memo, Project, ProjectNode, QuantityRecord } from '../domain/types'
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
  await db.transaction('rw', db.habits, db.checkRecords, db.quantityRecords, async () => {
    await db.habits.delete(id)
    await db.checkRecords.where('habitId').equals(id).delete()
    await db.quantityRecords.where('habitId').equals(id).delete()
  })
}

export async function addQuantity(habitId: string, amount: number, date = new Date()): Promise<QuantityRecord> {
  const key = dateKey(date)
  const existing = await db.quantityRecords.where('[habitId+date]').equals([habitId, key]).first()
  const record: QuantityRecord = { id: existing?.id ?? newId(), habitId, date: key, amount: Math.max(0, (existing?.amount ?? 0) + amount), updatedAt: new Date().toISOString() }
  await db.quantityRecords.put(record)
  return record
}

export async function setQuantity(habitId: string, amount: number, date = new Date()): Promise<QuantityRecord> {
  const key = dateKey(date)
  const existing = await db.quantityRecords.where('[habitId+date]').equals([habitId, key]).first()
  const record: QuantityRecord = { id: existing?.id ?? newId(), habitId, date: key, amount: Math.max(0, amount), updatedAt: new Date().toISOString() }
  await db.quantityRecords.put(record)
  return record
}

const stickyColors = ['#dce8f3', '#e4efdf', '#f8edc9', '#f3dfdf']

export async function createProject(input: Pick<Project, 'name' | 'client' | 'address'> & Partial<Pick<Project, 'color'>>): Promise<Project> {
  const now = new Date().toISOString()
  const project: Project = { id: newId(), name: input.name.trim(), client: input.client?.trim() || undefined, address: input.address?.trim() || undefined, color: input.color ?? stickyColors[0], status: 'active', createdAt: now, updatedAt: now }
  await db.projects.put(project)
  return project
}

export async function saveProject(project: Project): Promise<void> { await db.projects.put({ ...project, updatedAt: new Date().toISOString() }) }

export async function setProjectStatus(projectId: string, status: Project['status']): Promise<void> {
  const project = await db.projects.get(projectId)
  if (!project) return
  const now = new Date().toISOString()
  await db.projects.put({ ...project, status, completedAt: status === 'completed' ? now : undefined, updatedAt: now })
}

export async function deleteProject(projectId: string): Promise<void> {
  await db.transaction('rw', db.projects, db.projectNodes, async () => {
    await db.projects.delete(projectId)
    await db.projectNodes.where('projectId').equals(projectId).delete()
  })
}

export async function createProjectNode(projectId: string, title: string): Promise<ProjectNode> {
  const current = await db.projectNodes.where('projectId').equals(projectId).toArray()
  const now = new Date().toISOString()
  const node: ProjectNode = { id: newId(), projectId, title: title.trim(), position: current.length, status: 'pending', createdAt: now, updatedAt: now }
  await db.projectNodes.put(node)
  return node
}

export async function toggleProjectNode(nodeId: string): Promise<void> {
  const node = await db.projectNodes.get(nodeId)
  if (!node) return
  const completed = node.status !== 'completed'
  await db.projectNodes.put({ ...node, status: completed ? 'completed' : 'pending', completedAt: completed ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() })
}

export async function createLifeItem(title: string, note?: string, dueAt?: string): Promise<LifeItem> {
  const now = new Date().toISOString()
  const item: LifeItem = { id: newId(), title: title.trim(), note: note?.trim() || undefined, dueAt: dueAt || undefined, status: 'active', createdAt: now, updatedAt: now }
  await db.lifeItems.put(item)
  return item
}

export async function saveLifeItem(item: LifeItem): Promise<void> { await db.lifeItems.put({ ...item, updatedAt: new Date().toISOString() }) }

export async function toggleLifeItem(itemId: string): Promise<void> {
  const item = await db.lifeItems.get(itemId)
  if (!item) return
  const completed = item.status !== 'completed'
  await db.lifeItems.put({ ...item, status: completed ? 'completed' : 'active', completedAt: completed ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() })
}

export async function deleteLifeItem(itemId: string): Promise<void> { await db.lifeItems.delete(itemId) }

export async function createMemo(title: string, content: string, color = stickyColors[2]): Promise<Memo> {
  const now = new Date().toISOString()
  const memo: Memo = { id: newId(), title: title.trim(), content, color, pinned: false, status: 'active', createdAt: now, updatedAt: now }
  await db.memos.put(memo)
  return memo
}

export async function saveMemo(memo: Memo): Promise<void> { await db.memos.put({ ...memo, updatedAt: new Date().toISOString() }) }
export async function deleteMemo(memoId: string): Promise<void> { await db.memos.delete(memoId) }

export async function createBirthday(input: Omit<Birthday, 'id' | 'createdAt' | 'updatedAt'>): Promise<Birthday> {
  const now = new Date().toISOString()
  const birthday: Birthday = { ...input, id: newId(), createdAt: now, updatedAt: now }
  await db.birthdays.put(birthday)
  return birthday
}

export async function saveBirthday(birthday: Birthday): Promise<void> {
  await db.birthdays.put({ ...birthday, updatedAt: new Date().toISOString() })
}

export async function deleteBirthday(birthdayId: string): Promise<void> { await db.birthdays.delete(birthdayId) }

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
