export type ScheduleType = 'daily' | 'weeklyDays' | 'weeklyCount' | 'monthlyDate' | 'monthlyCount' | 'intervalMonths' | 'yearlyCount'

export type ScheduleConfig = { weekdays?: number[]; count?: number; day?: number; intervalMonths?: number }
export type ReminderMode = 'gentle'
export type ReminderRepeat = 'habit' | 'daily' | 'workdays' | 'weekends' | 'custom' | 'monthlyDate' | 'yearlyDate'
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
  reminderDay?: number
  reminderMonth?: number
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

export type StickyStatus = 'active' | 'completed' | 'archived'
export type CalendarType = 'gregorian' | 'lunar'

export type Project = {
  id: string
  name: string
  client?: string
  address?: string
  color: string
  status: StickyStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type ProjectNode = {
  id: string
  projectId: string
  title: string
  position: number
  status: 'pending' | 'completed'
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type LifeItem = {
  id: string
  title: string
  note?: string
  dueAt?: string
  status: StickyStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type Memo = {
  id: string
  title: string
  content: string
  color: string
  pinned: boolean
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export type Birthday = {
  id: string
  name: string
  relation?: string
  calendarType: CalendarType
  month: number
  day: number
  reminderOffsets: number[]
  createdAt: string
  updatedAt: string
}

export type ExportData = {
  schemaVersion: number
  exportedAt: string
  habits: Habit[]
  checkRecords: CheckRecord[]
  quantityRecords: QuantityRecord[]
  projects: Project[]
  projectNodes: ProjectNode[]
  lifeItems: LifeItem[]
  memos: Memo[]
  birthdays: Birthday[]
  settings: AppSetting[]
}
