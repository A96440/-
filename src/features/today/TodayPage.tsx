import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { setCheck } from '../../db/repositories'
import { dateKey, isHabitDueOnDate, startOfWeek } from '../../domain/schedule'
import { notifyPending } from '../../services/reminderService'

const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' })
const dateLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' })

export function TodayPage() {
  const [today] = useState(() => new Date())
  const todayKey = dateKey(today)
  const allHabits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), [], [])
  const checks = useLiveQuery(() => db.checkRecords.toArray(), [], [])
  const todayChecks = checks.filter((check) => check.date === todayKey)
  const todayCompleted = new Set(todayChecks.filter((check) => check.completed).map((check) => check.habitId))
  const weekStart = dateKey(startOfWeek(today))
  const monthPrefix = todayKey.slice(0, 7)
  const habits = allHabits.filter((habit) => {
    const completedInPeriod = habit.scheduleType === 'weeklyCount'
      ? checks.filter((check) => check.habitId === habit.id && check.completed && check.date >= weekStart && check.date <= todayKey).length
      : habit.scheduleType === 'monthlyCount'
        ? checks.filter((check) => check.habitId === habit.id && check.completed && check.date.startsWith(monthPrefix)).length
        : 0
    return todayCompleted.has(habit.id) || isHabitDueOnDate(habit, today, completedInPeriod)
  })
  const completed = new Set(habits.filter((habit) => todayCompleted.has(habit.id)).map((habit) => habit.id))
  const reminderSetting = useLiveQuery(() => db.settings.get('reminders'), [], undefined) as { value?: boolean } | undefined
  const notifiedDate = useRef('')
  useEffect(() => {
    if (reminderSetting?.value && habits.length > 0 && notifiedDate.current !== todayKey) {
      notifyPending(habits.length - completed.size)
      notifiedDate.current = todayKey
    }
  }, [completed.size, habits.length, reminderSetting?.value, todayKey])
  const contexts = [...new Set(habits.map((habit) => habit.context))]

  async function toggleTask(habitId: string) {
    await setCheck(habitId, today, !completed.has(habitId))
  }

  return <section className="page today-page">
    <header className="page-header today-header"><div><p className="eyebrow">{dateLabel.format(today)}</p><h1>今天，{weekday.format(today)}</h1></div><Link className="icon-button" title="添加习惯" to="/habits/new">＋</Link></header>
    {habits.length === 0 ? <div className="empty-state"><span>🌱</span><h2>今天还没有安排</h2><p>添加一个想坚持的小事情吧。</p><Link className="primary-button" to="/habits/new">添加习惯</Link></div> : <><div className="today-summary"><span>今日进度</span><strong>{completed.size} / {habits.length}</strong></div><div className="task-groups">{contexts.map((context) => <section className="task-group" key={context}><h2>{context}</h2><div className="task-list">{habits.filter((habit) => habit.context === context).map((habit) => { const isCompleted = completed.has(habit.id); return <button className={"task-card" + (isCompleted ? " completed" : "")} key={habit.id} onClick={() => toggleTask(habit.id)} style={isCompleted ? { '--task-color': habit.color } as CSSProperties : undefined} type="button"><span className="task-icon">{habit.icon}</span><span className="task-name">{habit.name}</span><span aria-hidden="true" className="task-check">{isCompleted ? '✓' : '○'}</span></button> })}</div></section>)}</div></>}
  </section>
}
