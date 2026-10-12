import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { db } from '../../db/db'
import { dateKey, getMonthDates, getWeekDates } from '../../domain/schedule'
import { setCheck } from '../../db/repositories'
import type { CheckRecord, Habit } from '../../domain/types'

type Period = 'day' | 'week' | 'month' | 'year'
const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

function cloneDate(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
function periodDates(period: Period, anchor: Date) {
  if (period === 'day') return [cloneDate(anchor)]
  if (period === 'week') return getWeekDates(anchor)
  if (period === 'month') return getMonthDates(anchor)
  if (period === 'year') return [new Date(anchor.getFullYear(), 0, 1), new Date(anchor.getFullYear(), 11, 31)]
  return []
}
function formatRange(dates: Date[], period: Period) {
  if (period === 'year') return dates[0].getFullYear() + '年'
  if (period === 'month') return dates[0].getFullYear() + '年' + (dates[0].getMonth() + 1) + '月'
  if (period === 'day') return dates[0].getMonth() + 1 + '月' + dates[0].getDate() + '日 星期' + dayLabels[(dates[0].getDay() + 6) % 7]
  if (dates.length === 1) return dates[0].getMonth() + 1 + '月' + dates[0].getDate() + '日'
  const start = dates[0]
  const end = dates[dates.length - 1]
  return (start.getMonth() + 1) + '月' + start.getDate() + '日—' + (end.getMonth() + 1) + '月' + end.getDate() + '日'
}
function formatLongRange(dates: Date[], period: Period) {
  if (period === 'year') return dates[0].getFullYear() + '年 · 每个习惯的全年记录'
  const format = (date: Date) => date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate()
  return dates.length === 1 ? format(dates[0]) : format(dates[0]) + ' – ' + format(dates[dates.length - 1])
}

export function HistoryPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const habits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), [], []) as Habit[]
  const checks = useLiveQuery(() => db.checkRecords.toArray(), [], []) as CheckRecord[]
  const dates = periodDates(period, anchor)
  const enabledHabits = habits.filter((habit) => habit.enabled)
  const completed = new Set(checks.filter((check) => check.completed).map((check) => check.habitId + ':' + check.date))
  const visibleHabitIds = new Set(enabledHabits.map((habit) => habit.id))
  const total = period === 'year'
    ? checks.filter((check) => check.completed && visibleHabitIds.has(check.habitId) && check.date.startsWith(String(anchor.getFullYear()))).length
    : checks.filter((check) => check.completed && visibleHabitIds.has(check.habitId) && dates.some((date) => dateKey(date) === check.date)).length

  function move(direction: number) {
    const next = cloneDate(anchor)
    if (period === 'day') next.setDate(next.getDate() + direction)
    if (period === 'week') next.setDate(next.getDate() + direction * 7)
    if (period === 'month') { next.setDate(1); next.setMonth(next.getMonth() + direction) }
    if (period === 'year') next.setFullYear(next.getFullYear() + direction)
    setAnchor(next)
  }
  async function toggle(habitId: string, date: Date) {
    await setCheck(habitId, date, !completed.has(habitId + ':' + dateKey(date)))
  }

  return <section className="page history-home">
    <div className="period-switch" role="tablist" aria-label="查看周期">{(['day', 'week', 'month', 'year'] as const).map((item) => <button className={period === item ? 'selected' : ''} key={item} onClick={() => setPeriod(item)} role="tab" type="button">{item === 'day' ? '日' : item === 'week' ? '周' : item === 'month' ? '月' : '年'}</button>)}</div>
    <div className="history-date-nav"><button aria-label="上一个周期" onClick={() => move(-1)} type="button">‹</button><strong>{formatRange(dates, period)}</strong><button aria-label="下一个周期" onClick={() => move(1)} type="button">›</button></div>
    <div className="history-heading"><div><h1><span aria-hidden="true" className="history-title-icon"><svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="16" rx="2" /><path d="M7.5 4.5v-2M16.5 4.5v-2M3.5 9h17M7 17v-3M12 17v-5M17 17v-8" /></svg></span> 打卡表</h1><p>{formatLongRange(dates, period)}</p></div><button className="filter-control" type="button">☷ <span>全部</span></button></div>
    {period === 'day' ? <DayTimeline date={dates[0]} habits={enabledHabits} checks={checks} /> : period === 'week' ? <MatrixTable dates={dates} habits={enabledHabits} completed={completed} onToggle={toggle} /> : period === 'month' ? <MonthSummary date={dates[0]} habits={enabledHabits} completed={completed} onToggle={toggle} /> : <YearSummary year={anchor.getFullYear()} habits={enabledHabits} completed={completed} onToggle={toggle} />}
    <div className="history-total">总计： <strong>{total}</strong></div>
  </section>
}

function DayTimeline({ date, habits, checks }: { date: Date; habits: Habit[]; checks: CheckRecord[] }) {
  const byId = new Map(habits.map((habit) => [habit.id, habit]))
  const records = checks.filter((check) => check.completed && check.date === dateKey(date) && byId.has(check.habitId)).sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))
  return <div className="timeline-card"><div className="timeline-header"><strong>时间线</strong><span>{records.length} 条记录</span></div>{records.length === 0 ? <div className="timeline-empty">今天还没有完成的习惯</div> : <div className="timeline-list">{records.map((record) => { const habit = byId.get(record.habitId)!; const time = record.completedAt ? new Date(record.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '—'; return <div className="timeline-item" key={record.id}><div className="timeline-time"><span>{time}</span><i /></div><span className="timeline-item-icon" style={{ backgroundColor: habit.color }}>{habit.icon}</span><div className="timeline-item-copy"><strong>{habit.name}</strong><small>已完成 · {habit.context}</small></div></div> })}</div>}</div>
}

function MatrixTable({ dates, habits, completed, onToggle }: { dates: Date[]; habits: Habit[]; completed: Set<string>; onToggle: (habitId: string, date: Date) => Promise<void> }) {
  return <div className="checkin-table" style={{ '--day-count': dates.length } as CSSProperties}><div className="checkin-row checkin-header"><div className="habit-column">全部习惯</div>{dates.map((date, index) => <div className={index > 4 ? 'day-column weekend' : 'day-column'} key={dateKey(date)}>{dates.length === 1 ? date.getDate() : dayLabels[index]}{dates.length > 1 && <small>{date.getDate()}</small>}</div>)}</div>{habits.length === 0 ? <div className="checkin-empty">还没有启用的习惯</div> : habits.map((habit) => <div className="checkin-row" key={habit.id}><div className="habit-column"><span className="habit-row-icon">{habit.icon}</span><strong>{habit.name}</strong></div>{dates.map((date) => { const checked = completed.has(habit.id + ':' + dateKey(date)); return <button aria-label={habit.name + ' ' + dateKey(date)} className={checked ? 'day-cell checked' : 'day-cell'} key={dateKey(date)} onClick={() => onToggle(habit.id, date)} style={checked ? { '--check-color': habit.color } as CSSProperties : undefined} type="button"><span>{checked ? '✓' : ''}</span></button> })}</div>)}</div>
}

function MonthSummary({ date, habits, completed, onToggle }: { date: Date; habits: Habit[]; completed: Set<string>; onToggle: (habitId: string, date: Date) => Promise<void> }) {
  const dates = getMonthDates(date)
  return <div className="habit-period-grid month-period-grid">{habits.length === 0 ? <div className="checkin-empty">还没有启用的习惯</div> : habits.map((habit) => <article className="period-habit-card month-habit-card" key={habit.id}><HabitPeriodHeader habit={habit} count={dates.filter((day) => completed.has(habit.id + ':' + dateKey(day))).length} /><div className="mini-weekdays">{dayLabels.map((label) => <span key={label}>{label}</span>)}</div><div className="month-habit-grid">{Array.from({ length: (dates[0].getDay() + 6) % 7 }, (_, index) => <span className="mini-day empty" key={'empty-' + index} />)}{dates.map((day) => { const checked = completed.has(habit.id + ':' + dateKey(day)); return <button className={checked ? 'mini-day checked' : 'mini-day'} key={dateKey(day)} onClick={() => onToggle(habit.id, day)} style={checked ? { '--check-color': habit.color } as CSSProperties : undefined} type="button">{day.getDate()}</button> })}</div></article>)}</div>
}

function YearSummary({ year, habits, completed, onToggle }: { year: number; habits: Habit[]; completed: Set<string>; onToggle: (habitId: string, date: Date) => Promise<void> }) {
  return <div className="habit-period-grid year-period-grid">{habits.length === 0 ? <div className="checkin-empty">还没有启用的习惯</div> : habits.map((habit) => <article className="period-habit-card year-habit-card" key={habit.id}><HabitPeriodHeader habit={habit} count={Array.from(completed).filter((key) => key.startsWith(habit.id + ':') && key.slice(-10).startsWith(String(year))).length} /><div className="year-mini-grid">{Array.from({ length: 12 }, (_, month) => { const monthDate = new Date(year, month, 1); const monthDates = getMonthDates(monthDate); const offset = (monthDate.getDay() + 6) % 7; return <div className="mini-month" key={month}><strong>{month + 1}月</strong><div className="mini-month-days">{Array.from({ length: offset }, (_, index) => <span className="mini-day empty" key={'empty-' + index} />)}{monthDates.map((day) => { const checked = completed.has(habit.id + ':' + dateKey(day)); return <button aria-label={habit.name + ' ' + dateKey(day)} className={checked ? 'mini-day checked' : 'mini-day'} key={dateKey(day)} onClick={() => onToggle(habit.id, day)} style={checked ? { '--check-color': habit.color } as CSSProperties : undefined} type="button" /> })}</div></div> })}</div></article>)}</div>
}

function HabitPeriodHeader({ habit, count }: { habit: Habit; count: number }) {
  return <div className="habit-period-header"><span className="period-habit-icon" style={{ backgroundColor: habit.color }}>{habit.icon}</span><div><strong>{habit.name}</strong><small>完成 {count} 天</small></div></div>
}
