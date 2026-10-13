export type ScheduleType = 'daily' | 'weeklyDays' | 'weeklyCount' | 'monthlyDate' | 'monthlyCount' | 'intervalMonths' | 'yearlyCount'

export type ScheduleConfig = { weekdays?: number[]; count?: number; day?: number; intervalMonths?: number }
export type ReminderMode = 'gentle'
export type ReminderRepeat = 'daily' | 'workdays' | 'weekends' | 'custom'
export type QuantityUnit = 'custom' | '次' | '杯' | '毫升' | '分钟' | '小时' | '公里' | '米' | '步' | '页' | '组' | '颗'

export type Habit = {
  id: string
  name: string
  icon: string
  color: string
  context: string
  scheduleType: ScheduleType
  scheduleConfig: ScheduleConfig
  reminderTime?: string
  reminderEnabled?: boolean
  reminderMode?: ReminderMode
  reminderRepeat?: ReminderRepeat
  reminderWeekdays?: number[]
  reminderCustomUnit?: string
  quantityEnabled?: boolean
  quantityUnit?: QuantityUnit
  quantityCustomUnit?: string
  quantityIncrement?: number
  quantityDailyTarget?: number
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

export type QuantityRecord = {
  id: string
  habitId: string
  date: string
  amount: number
  updatedAt: string
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
  quantityRecords: QuantityRecord[]
  settings: AppSetting[]
}
