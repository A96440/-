import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { addQuantity, setCheck } from '../../db/repositories'
import { dateKey, daysInMonth, isHabitDueOnDate, startOfWeek } from '../../domain/schedule'
import { notifyHabit } from '../../services/reminderService'
import type { Habit } from '../../domain/types'

const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' })
const dateLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' })
const contextOrder = ['起床', '晨间', '上午', '中午', '午间', '下午', '晚间', '晚上', '睡前', '全天']

function reminderMatches(habit: Habit, date: Date) {
  const day = date.getDay()
  if (habit.reminderRepeat === 'workdays') return day >= 1 && day <= 5
  if (habit.reminderRepeat === 'weekends') return day === 0 || day === 6
  if (habit.reminderRepeat === 'custom') return habit.reminderWeekdays?.includes(day) ?? false
  if (habit.reminderRepeat === 'monthlyDate') return date.getDate() === Math.min(habit.reminderDay ?? 1, daysInMonth(date.getFullYear(), date.getMonth()))
  if (habit.reminderRepeat === 'yearlyDate') return date.getMonth() + 1 === (habit.reminderMonth ?? 1) && date.getDate() === Math.min(habit.reminderDay ?? 1, daysInMonth(date.getFullYear(), date.getMonth()))
  if (habit.reminderRepeat === 'habit') {
    if (habit.scheduleType === 'intervalMonths') {
      const created = new Date(habit.createdAt)
      const monthDelta = (date.getFullYear() - created.getFullYear()) * 12 + date.getMonth() - created.getMonth()
      const interval = Math.max(1, habit.scheduleConfig.intervalMonths ?? 3)
      return monthDelta >= 0 && monthDelta % interval === 0 && date.getDate() === Math.min(habit.scheduleConfig.day ?? created.getDate(), daysInMonth(date.getFullYear(), date.getMonth()))
    }
    if (habit.scheduleType === 'yearlyCount') return false
    return isHabitDueOnDate(habit, date, 0)
  }
  return true
}

function intervalStart(habit: Habit, date: Date) {
  const created = new Date(habit.createdAt)
  const monthDelta = (date.getFullYear() - created.getFullYear()) * 12 + date.getMonth() - created.getMonth()
  const interval = Math.max(1, habit.scheduleConfig.intervalMonths ?? 3)
  const cycleIndex = Math.max(0, Math.floor(monthDelta / interval))
  const month = created.getMonth() + cycleIndex * interval
  const day = Math.min(habit.scheduleConfig.day ?? created.getDate(), daysInMonth(created.getFullYear(), month))
  return new Date(created.getFullYear(), month, day)
}

function unitLabel(habit: Habit) {
  return habit.quantityUnit === 'custom' ? habit.quantityCustomUnit || '次' : habit.quantityUnit || '次'
}

export function TodayPage() {
  const [today] = useState(() => new Date())
  const todayKey = dateKey(today)
  const allHabits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), [], []) as Habit[]
  const checks = useLiveQuery(() => db.checkRecords.toArray(), [], [])
  const quantities = useLiveQuery(() => db.quantityRecords.toArray(), [], [])
  const todayChecks = checks.filter((check) => check.date === todayKey)
  const todayCompleted = new Set(todayChecks.filter((check) => check.completed).map((check) => check.habitId))
  const weekStart = dateKey(startOfWeek(today))
  const monthPrefix = todayKey.slice(0, 7)
  const habits = allHabits.filter((habit) => {
    const completedInPeriod = habit.scheduleType === 'weeklyCount'
      ? checks.filter((check) => check.habitId === habit.id && check.completed && check.date >= weekStart && check.date <= todayKey).length
      : habit.scheduleType === 'monthlyCount'
        ? checks.filter((check) => check.habitId === habit.id && check.completed && check.date.startsWith(monthPrefix)).length
        : habit.scheduleType === 'intervalMonths'
          ? checks.filter((check) => check.habitId === habit.id && check.completed && check.date >= dateKey(intervalStart(habit, today)) && check.date <= todayKey).length
        : habit.scheduleType === 'yearlyCount'
          ? checks.filter((check) => check.habitId === habit.id && check.completed && check.date.startsWith(todayKey.slice(0, 4))).length
        : 0
    return todayCompleted.has(habit.id) || isHabitDueOnDate(habit, today, completedInPeriod)
  })
  const completed = new Set(habits.filter((habit) => todayCompleted.has(habit.id)).map((habit) => habit.id))
  const reminded = useRef(new Set<string>())

  useEffect(() => {
    function checkReminders() {
      const now = new Date()
      const time = now.toTimeString().slice(0, 5)
      habits.filter((habit) => habit.reminderEnabled && habit.reminderTime === time && reminderMatches(habit, now)).forEach((habit) => {
        const key = `${habit.id}:${todayKey}:${time}`
        if (!reminded.current.has(key)) { notifyHabit(habit.name, time); reminded.current.add(key) }
      })
    }
    checkReminders()
    const timer = window.setInterval(checkReminders, 30_000)
    return () => window.clearInterval(timer)
  }, [habits, todayKey])

  async function toggleTask(habitId: string) {
    await setCheck(habitId, today, !completed.has(habitId))
  }

  async function addHabitQuantity(habit: Habit) {
    const record = await addQuantity(habit.id, habit.quantityIncrement ?? 1, today)
    if (habit.quantityDailyTarget && record.amount >= habit.quantityDailyTarget) await setCheck(habit.id, today, true)
  }

  function handleTaskKey(event: KeyboardEvent<HTMLElement>, habitId: string) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void toggleTask(habitId) }
  }

  const pendingHabits = habits.filter((habit) => !completed.has(habit.id))
  const completedHabits = habits.filter((habit) => completed.has(habit.id))
  const contexts = [...new Set(pendingHabits.map((habit) => habit.context))].sort((a, b) => (contextOrder.indexOf(a) + 1 || 99) - (contextOrder.indexOf(b) + 1 || 99))
  const quantityMap = new Map(quantities.filter((record) => record.date === todayKey).map((record) => [record.habitId, record.amount]))
  const renderHabit = (habit: Habit, isCompleted: boolean) => {
    const amount = quantityMap.get(habit.id) ?? 0
    const unit = unitLabel(habit)
    return <article className={'task-card' + (isCompleted ? ' completed' : '')} key={habit.id} onClick={() => void toggleTask(habit.id)} onKeyDown={(event) => handleTaskKey(event, habit.id)} role="button" style={isCompleted ? { '--task-color': habit.color } as CSSProperties : undefined} tabIndex={0}>
      <span className="task-icon">{habit.icon}</span><span className="task-name">{habit.name}</span>
      {habit.quantityEnabled && <span className="quantity-progress">{amount}{habit.quantityDailyTarget ? `/${habit.quantityDailyTarget}` : ''}{unit}</span>}
      {habit.quantityEnabled && <button aria-label={`${habit.name} 增加 ${habit.quantityIncrement ?? 1}${unit}`} className="quantity-add" onClick={(event) => { event.stopPropagation(); void addHabitQuantity(habit) }} onKeyDown={(event) => event.stopPropagation()} type="button">＋{habit.quantityIncrement ?? 1}</button>}
      <span aria-hidden="true" className="task-check">{isCompleted ? '✓' : '○'}</span>
    </article>
  }

  return <section className="page today-page">
    <header className="page-header today-header"><div><p className="eyebrow">{dateLabel.format(today)}</p><h1>今天，{weekday.format(today)}</h1></div><Link className="icon-button" title="添加习惯" to="/habits/new">＋</Link></header>
    {habits.length === 0 ? <div className="empty-state"><span>🌱</span><h2>今天还没有安排</h2><p>添加一个想坚持的小事情吧。</p><Link className="primary-button" to="/habits/new">添加习惯</Link></div> : <>
      <div className="task-groups">{contexts.map((context) => <section className="task-group" key={context}><h2>{context}</h2><div className="task-list">{pendingHabits.filter((habit) => habit.context === context).map((habit) => renderHabit(habit, false))}</div></section>)}</div>
      {completedHabits.length > 0 && <section className="completed-section"><div className="completed-heading"><h2>已完成</h2><span>{completedHabits.length} 项</span></div><div className="task-list">{completedHabits.map((habit) => renderHabit(habit, true))}</div></section>}
    </>}
  </section>
}
