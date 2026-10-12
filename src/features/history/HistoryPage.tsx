import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { db } from '../../db/db'
import { dateKey, getMonthDates, getWeekDates } from '../../domain/schedule'
import { setCheck } from '../../db/repositories'
import type { CheckRecord, Habit } from '../../domain/types'

type Period = 'day' | 'week' | 'month' | 'year'
const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

function cloneDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function periodDates(period: Period, anchor: Date) {
  if (period === 'day') return [cloneDate(anchor)]
  if (period === 'week') return getWeekDates(anchor)
  if (period === 'month') return getMonthDates(anchor)
  return []
}

function formatRange(dates: Date[]) {
  if (dates.length === 1) return dates[0].getMonth() + 1 + '月' + dates[0].getDate() + '日'
  const start = dates[0]
  const end = dates[dates.length - 1]
  return (start.getMonth() + 1) + '月' + start.getDate() + '日—' + (end.getMonth() + 1) + '月' + end.getDate() + '日'
}

function formatLongRange(dates: Date[]) {
  const start = dates[0]
  const end = dates[dates.length - 1]
  const format = (date: Date) => date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate()
  return dates.length === 1 ? format(start) : format(start) + ' – ' + format(end)
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
  const total = checks.filter((check) => check.completed && visibleHabitIds.has(check.habitId) && dates.some((date) => dateKey(date) === check.date)).length

  function move(direction: number) {
    const next = cloneDate(anchor)
    if (period === 'day') next.setDate(next.getDate() + direction)
    if (period === 'week') next.setDate(next.getDate() + direction * 7)
    if (period === 'month') next.setMonth(next.getMonth() + direction)
    if (period === 'year') next.setFullYear(next.getFullYear() + direction)
    setAnchor(next)
  }

  async function toggle(habitId: string, date: Date) {
    const key = habitId + ':' + dateKey(date)
    await setCheck(habitId, date, !completed.has(key))
  }

  return <section className="page history-home">
    <div className="period-switch" role="tablist" aria-label="查看周期">{(['day', 'week', 'month', 'year'] as const).map((item) => <button className={period === item ? 'selected' : ''} key={item} onClick={() => setPeriod(item)} role="tab" type="button">{item === 'day' ? '日' : item === 'week' ? '周' : item === 'month' ? '月' : '年'}</button>)}</div>
    <div className="history-date-nav"><button aria-label="上一个周期" onClick={() => move(-1)} type="button">‹</button><strong>{formatRange(dates)}</strong><button aria-label="下一个周期" onClick={() => move(1)} type="button">›</button></div>
    <div className="history-heading"><div><h1><span aria-hidden="true">▣</span> 打卡表</h1><p>{formatLongRange(dates)}</p></div><button className="filter-control" type="button">☷ <span>全部</span></button></div>
    {period === 'day' || period === 'week' ? <MatrixTable dates={dates} habits={enabledHabits} completed={completed} onToggle={toggle} /> : period === 'month' ? <MonthSummary dates={dates} habits={enabledHabits} completed={completed} total={total} /> : <YearSummary year={anchor.getFullYear()} checks={checks} total={total} />}
    <div className="history-total">总计： <strong>{total}</strong></div>
  </section>
}

function MatrixTable({ dates, habits, completed, onToggle }: { dates: Date[]; habits: Habit[]; completed: Set<string>; onToggle: (habitId: string, date: Date) => Promise<void> }) {
  return <div className="checkin-table" style={{ '--day-count': dates.length } as CSSProperties}>
    <div className="checkin-row checkin-header"><div className="habit-column">全部习惯</div>{dates.map((date, index) => <div className={index > 4 ? 'day-column weekend' : 'day-column'} key={dateKey(date)}>{dates.length === 1 ? date.getDate() : dayLabels[index]}{dates.length > 1 && <small>{date.getDate()}</small>}</div>)}</div>
    {habits.length === 0 ? <div className="checkin-empty">还没有启用的习惯</div> : habits.map((habit) => <div className="checkin-row" key={habit.id}><div className="habit-column"><span className="habit-row-icon">{habit.icon}</span><strong>{habit.name}</strong></div>{dates.map((date) => { const checked = completed.has(habit.id + ':' + dateKey(date)); return <button aria-label={habit.name + ' ' + dateKey(date)} className={checked ? 'day-cell checked' : 'day-cell'} key={dateKey(date)} onClick={() => onToggle(habit.id, date)} style={checked ? { '--check-color': habit.color } as CSSProperties : undefined} type="button"><span>{checked ? '✓' : ''}</span></button> })}</div>)}
  </div>
}

function MonthSummary({ dates, habits, completed, total }: { dates: Date[]; habits: Habit[]; completed: Set<string>; total: number }) {
  return <div className="month-view"><div className="month-summary"><strong>{total}</strong><span>本月完成次数</span></div><div className="calendar-grid">{dates.map((date) => { const count = habits.filter((habit) => completed.has(habit.id + ':' + dateKey(date))).length; return <div className={count ? 'calendar-day has-check' : 'calendar-day'} key={dateKey(date)}><span>{date.getDate()}</span><b>{count || '·'}</b></div> })}</div></div>
}

function YearSummary({ year, checks, total }: { year: number; checks: CheckRecord[]; total: number }) {
  return <div className="year-view"><div className="month-summary"><strong>{total}</strong><span>{year} 年完成次数</span></div><div className="year-grid">{Array.from({ length: 12 }, (_, month) => { const prefix = year + '-' + String(month + 1).padStart(2, '0'); const count = checks.filter((check) => check.completed && check.date.startsWith(prefix)).length; return <div className="year-month" key={prefix}><span>{month + 1} 月</span><strong>{count}</strong></div> })}</div></div>
}

