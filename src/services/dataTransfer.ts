import { db } from '../db/db'
import type { ExportData } from '../domain/types'

export async function createExportData(): Promise<ExportData> {
  return { schemaVersion: 2, exportedAt: new Date().toISOString(), habits: await db.habits.toArray(), checkRecords: await db.checkRecords.toArray(), quantityRecords: await db.quantityRecords.toArray(), settings: await db.settings.toArray() }
}

export async function downloadBackup(): Promise<void> {
  const data = await createExportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = `xiaorizi-backup-${data.exportedAt.slice(0, 10)}.json`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function importBackup(file: File): Promise<void> {
  const parsed = JSON.parse(await file.text()) as Partial<ExportData>
  const quantityRecords = Array.isArray(parsed.quantityRecords) ? parsed.quantityRecords : []
  const valid = (parsed.schemaVersion === 1 || parsed.schemaVersion === 2) && Array.isArray(parsed.habits) && Array.isArray(parsed.checkRecords) && Array.isArray(parsed.settings) && parsed.habits.every((habit) => habit && typeof habit.id === 'string' && typeof habit.name === 'string') && parsed.checkRecords.every((record) => record && typeof record.id === 'string' && typeof record.habitId === 'string' && typeof record.date === 'string') && quantityRecords.every((record) => record && typeof record.id === 'string' && typeof record.habitId === 'string' && typeof record.date === 'string' && typeof record.amount === 'number') && parsed.settings.every((setting) => setting && typeof setting.key === 'string')
  if (!valid) throw new Error('备份文件格式不受支持')
  await db.transaction('rw', db.habits, db.checkRecords, db.quantityRecords, db.settings, async () => {
    await db.habits.bulkPut(parsed.habits!)
    await db.checkRecords.bulkPut(parsed.checkRecords!)
    await db.quantityRecords.bulkPut(quantityRecords)
    await db.settings.bulkPut(parsed.settings!)
  })
}
