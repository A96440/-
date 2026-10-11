export type ScheduleType = 'daily' | 'weeklyDays' | 'weeklyCount' | 'monthlyDate' | 'monthlyCount'

export type ScheduleConfig = { weekdays?: number[]; count?: number; day?: number }

export type Habit = {
  id: string
  name: string
  icon: string
  color: string
  context: string
  scheduleType: ScheduleType
  scheduleConfig: ScheduleConfig
  reminderTime?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type CheckRecord = {
  id: string
  habitId: string
  date: string
  completed: boolean
  completedAt?: string
}

export type AppSetting = {
  key: string
  value: unknown
}

export type ExportData = {
  schemaVersion: number
  exportedAt: string
  habits: Habit[]
  checkRecords: CheckRecord[]
  settings: AppSetting[]
}
