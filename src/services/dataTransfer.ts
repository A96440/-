import { db } from '../db/db'
import type { ExportData } from '../domain/types'

export async function createExportData(): Promise<ExportData> {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), habits: await db.habits.toArray(), checkRecords: await db.checkRecords.toArray(), settings: await db.settings.toArray() }
}

export async function downloadBackup(): Promise<void> {
  const data = await createExportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = `xiaorizi-backup-${data.exportedAt.slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url)
}

export async function importBackup(file: File): Promise<void> {
  const parsed = JSON.parse(await file.text()) as Partial<ExportData>
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.habits) || !Array.isArray(parsed.checkRecords) || !Array.isArray(parsed.settings)) throw new Error('备份文件格式不受支持')
  await db.transaction('rw', db.habits, db.checkRecords, db.settings, async () => {
    await db.habits.bulkPut(parsed.habits!)
    await db.checkRecords.bulkPut(parsed.checkRecords!)
    await db.settings.bulkPut(parsed.settings!)
  })
}
