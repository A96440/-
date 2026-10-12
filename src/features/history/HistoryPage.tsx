import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db/db'
import { dateKey, getMonthDates, getWeekDates } from '../../domain/schedule'
import type { CheckRecord, Habit } from '../../domain/types'

type Period = 'week' | 'month' | 'year'
const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

export function HistoryPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [today] = useState(() => new Date())
  const weekDates = getWeekDates(today)
  const monthDates = getMonthDates(today)
  const year = today.getFullYear()
  const habits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), [], []) as Habit[]
  const checks = useLiveQuery(() => db.checkRecords.where('date').between(year + '-01-01', year + '-12-31', true, true).toArray(), [year], []) as CheckRecord[]
  const completed = new Set(checks.filter((check) => check.completed).map((check) => check.habitId + ':' + check.date))
  const weekKeys = new Set(weekDates.map(dateKey))
  const weekCompleted = checks.filter((check) => check.completed && weekKeys.has(check.date)).length
  const yearCompleted = checks.filter((check) => check.completed).length
  const monthCompleted = checks.filter((check) => check.completed && check.date.startsWith(year + '-' + String(today.getMonth() + 1).padStart(2, '0'))).length

  return <section className="page"><header className="page-header"><div><p className="eyebrow">坚持的痕迹</p><h1>打卡表</h1></div><span className="quiet-button">{year} 年</span></header><div className="period-tabs" role="tablist" aria-label="统计周期">{(['week', 'month', 'year'] as const).map((item) => <button className={period === item ? 'selected' : ''} key={item} onClick={() => setPeriod(item)} role="tab" type="button">{item === 'week' ? '周' : item === 'month' ? '月' : '年'}</button>)}</div>{period === 'week' && <WeekView habits={habits} dates={weekDates} completed={completed} weekCompleted={weekCompleted} />}{period === 'month' && <MonthView dates={monthDates} completed={completed} habits={habits} monthCompleted={monthCompleted} />}{period === 'year' && <YearView year={year} checks={checks} yearCompleted={yearCompleted} />}</section>
}

function WeekView({ habits, dates, completed, weekCompleted }: { habits: Habit[]; dates: Date[]; completed: Set<string>; weekCompleted: number }) {
  return <><div className="history-card"><div className="history-week"><span>习惯</span>{dates.map((date, index) => <span key={dateKey(date)}>{dayLabels[index]}<small>{date.getDate()}</small></span>)}</div>{habits.length === 0 ? <p className="history-empty">创建习惯后，这里会显示打卡记录。</p> : habits.map((habit) => <div className="history-row" key={habit.id}><span className="history-habit">{habit.icon} {habit.name}</span>{dates.map((date) => { const done = completed.has(habit.id + ':' + dateKey(date)); return <span className={done ? 'history-check done' : 'history-check'} key={dateKey(date)}>{done ? '✓' : '○'}</span> })}</div>)}</div><div className="stat-grid"><div><strong>{habits.length ? Math.round((weekCompleted / (habits.length * 7)) * 100) : 0}%</strong><span>本周完成率</span></div><div><strong>{weekCompleted}</strong><span>本周完成次数</span></div></div></>
}

function MonthView({ dates, completed, habits, monthCompleted }: { dates: Date[]; completed: Set<string>; habits: Habit[]; monthCompleted: number }) {
  return <><div className="month-summary"><strong>{monthCompleted}</strong><span>本月完成次数</span></div><div className="calendar-grid">{dates.map((date) => { const count = habits.filter((habit) => completed.has(habit.id + ':' + dateKey(date))).length; return <div className={count ? 'calendar-day has-check' : 'calendar-day'} key={dateKey(date)}><span>{date.getDate()}</span><b>{count || '·'}</b></div> })}</div></>
}

function YearView({ year, checks, yearCompleted }: { year: number; checks: CheckRecord[]; yearCompleted: number }) {
  return <><div className="month-summary"><strong>{yearCompleted}</strong><span>{year} 年完成次数</span></div><div className="year-grid">{Array.from({ length: 12 }, (_, month) => { const prefix = year + '-' + String(month + 1).padStart(2, '0'); const count = checks.filter((check) => check.completed && check.date.startsWith(prefix)).length; return <div className="year-month" key={prefix}><span>{month + 1} 月</span><strong>{count}</strong></div> })}</div></>
}

