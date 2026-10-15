import type { Birthday } from './types'

const lunarMonths: Record<string, number> = { '正月': 1, '一月': 1, '二月': 2, '三月': 3, '四月': 4, '五月': 5, '六月': 6, '七月': 7, '八月': 8, '九月': 9, '十月': 10, '十一月': 11, '十二月': 12 }
const lunarFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'numeric', day: 'numeric' })

function lunarParts(date: Date) {
  const parts = lunarFormatter.formatToParts(date)
  const monthText = parts.find((part) => part.type === 'month')?.value ?? ''
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? 0)
  const month = lunarMonths[monthText.replace('闰', '')] ?? Number.parseInt(monthText, 10)
  return { month, day, leap: monthText.startsWith('闰') }
}

export function nextBirthdayDate(birthday: Birthday, from = new Date()): Date {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  if (birthday.calendarType === 'gregorian') {
    const candidate = new Date(start.getFullYear(), birthday.month - 1, birthday.day)
    if (candidate < start) candidate.setFullYear(candidate.getFullYear() + 1)
    return candidate
  }
  for (let offset = 0; offset <= 800; offset += 1) {
    const candidate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset)
    const parts = lunarParts(candidate)
    if (parts.month === birthday.month && parts.day === birthday.day && !parts.leap) return candidate
  }
  return new Date(start.getFullYear(), start.getMonth(), start.getDate())
}

export function daysUntil(date: Date, from = new Date()): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return Math.max(0, Math.round((target - start) / 86_400_000))
}

export function lunarMonthLabel(month: number): string { return ['','正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][month] ?? `${month}月` }
export function lunarDayLabel(day: number): string {
  const ones = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (day <= 10) return `初${ones[day] ?? ''}`
  if (day < 20) return `十${ones[day - 10] ?? ''}`
  if (day === 20) return '二十'
  if (day < 30) return `廿${ones[day - 20] ?? ''}`
  return '三十'
}
