import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { setCheck, setQuantity } from '../../db/repositories'
import { dateKey, daysInMonth } from '../../domain/schedule'
import type { CheckRecord, Habit } from '../../domain/types'

type DetailTab = 'calendar' | 'trend' | 'more'
const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

function scheduleLabel(habit: Habit): string {
  if (habit.scheduleType === 'daily') return '每天'
  if (habit.scheduleType === 'weeklyCount') return `每周${habit.scheduleConfig.count ?? 1}天`
  if (habit.scheduleType === 'monthlyCount') return `每月${habit.scheduleConfig.count ?? 1}天`
  if (habit.scheduleType === 'monthlyDate') return `每月固定${habit.scheduleConfig.day ?? 1}日`
  if (habit.scheduleType === 'intervalMonths') return `每${habit.scheduleConfig.intervalMonths ?? 3}个月一次`
  if (habit.scheduleType === 'yearlyCount') return `每年${habit.scheduleConfig.count ?? 1}次`
  return `每周${habit.scheduleConfig.weekdays?.length ?? 0}天`
}

function quantityLabel(habit: Habit) { return habit.quantityUnit === 'custom' ? habit.quantityCustomUnit || '单位' : habit.quantityUnit || '次' }

function completedStreak(checks: CheckRecord[]) {
  const completed = new Set(checks.filter((check) => check.completed).map((check) => check.date))
  const cursor = new Date()
  let count = 0
  while (completed.has(dateKey(cursor))) { count += 1; cursor.setDate(cursor.getDate() - 1) }
  return count
}

function formatNumber(value: number) { return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '') }

export function HabitDetailPage() {
  const { id } = useParams()
  const habitQuery = useLiveQuery(() => id ? db.habits.get(id) : undefined, [id])
  const checksQuery = useLiveQuery(() => id ? db.checkRecords.where('habitId').equals(id).toArray() : [], [id])
  const quantitiesQuery = useLiveQuery(() => id ? db.quantityRecords.where('habitId').equals(id).toArray() : [], [id])
  const [tab, setTab] = useState<DetailTab>('calendar')
  const [today] = useState(() => new Date())
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const backfillKey = useRef('')

  useEffect(() => {
    if (!habitQuery?.quantityEnabled || !checksQuery || !quantitiesQuery) return
    const recordedDates = new Set(quantitiesQuery.filter((record) => record.amount > 0).map((record) => record.date))
    const missing = checksQuery.filter((check) => check.completed && !recordedDates.has(check.date))
    if (missing.length === 0) return
    const key = `${habitQuery.id}:${missing.map((check) => check.date).join(',')}`
    if (backfillKey.current === key) return
    backfillKey.current = key
    void Promise.all(missing.map((check) => setQuantity(habitQuery.id, habitQuery.quantityIncrement ?? 1, new Date(`${check.date}T12:00:00`))))
  }, [checksQuery, habitQuery, quantitiesQuery])

  if (habitQuery === undefined || checksQuery === undefined || quantitiesQuery === undefined) return <section className="page loading-page" aria-busy="true"><div className="loading-card" /><div className="loading-card" /><div className="loading-card short" /></section>
  if (!habitQuery) return <section className="page"><Link className="back-link" to="/habits">← 返回打卡管理</Link><div className="empty-state"><h2>找不到这个习惯</h2><Link className="primary-button" to="/habits">返回列表</Link></div></section>

  const habit = habitQuery
  const checks = checksQuery ?? []
  const quantities = quantitiesQuery ?? []
  const completed = checks.filter((check) => check.completed)
  const quantityTotal = quantities.reduce((sum, record) => sum + record.amount, 0)
  const unit = quantityLabel(habit)
  const monthDays = daysInMonth(month.getFullYear(), month.getMonth())
  const monthOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7
  const checkedDates = new Set(completed.map((check) => check.date))
  const monthCompleted = Array.from({ length: monthDays }, (_, index) => dateKey(new Date(month.getFullYear(), month.getMonth(), index + 1))).filter((key) => checkedDates.has(key)).length
  const trend = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (29 - index))
    const key = dateKey(date)
    return { key, day: date.getDate(), amount: quantities.find((record) => record.date === key)?.amount ?? 0 }
  })
  const maxTrend = Math.max(1, ...trend.map((entry) => entry.amount))

  async function toggleDate(key: string) {
    await setCheck(habit.id, new Date(`${key}T12:00:00`), !checkedDates.has(key))
  }

  function moveMonth(amount: number) { setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1)) }

  return <section className="page habit-detail-page"><header className="page-header"><div><Link className="back-link" to="/habits">← 返回打卡管理</Link></div><Link aria-label="编辑习惯" className="icon-button" to={`/habits/${habit.id}/edit`}>✎</Link></header><section className="habit-detail-hero"><span className="habit-detail-icon" style={{ backgroundColor: habit.color }}>{habit.icon}</span><h1>{habit.name}</h1><span className="habit-detail-schedule">{scheduleLabel(habit)}</span></section><div className="habit-stat-grid"><div><strong>{completed.length}</strong><span>总完成</span></div><div><strong>{habit.quantityEnabled ? `${formatNumber(quantityTotal)}${unit}` : '—'}</strong><span>量化记录</span></div><div><strong>{completedStreak(checks)}天</strong><span>连续完成</span></div><div><strong>{monthCompleted}天</strong><span>本月完成</span></div></div><div aria-label="习惯详情标签" className="habit-detail-tabs" role="tablist"><button aria-selected={tab === 'calendar'} className={tab === 'calendar' ? 'selected' : ''} onClick={() => setTab('calendar')} role="tab" type="button">打卡日历</button><button aria-selected={tab === 'trend'} className={tab === 'trend' ? 'selected' : ''} onClick={() => setTab('trend')} role="tab" type="button">量化趋势</button><button aria-selected={tab === 'more'} className={tab === 'more' ? 'selected' : ''} onClick={() => setTab('more')} role="tab" type="button">其它</button></div>{tab === 'calendar' && <section className="habit-detail-section"><div className="detail-section-heading"><h2>打卡日历</h2><div className="month-nav"><button aria-label="上个月" onClick={() => moveMonth(-1)} type="button">‹</button><strong>{month.getFullYear()}年{month.getMonth() + 1}月</strong><button aria-label="下个月" onClick={() => moveMonth(1)} type="button">›</button></div></div><div className="detail-weekdays">{dayLabels.map((label) => <span key={label}>周{label}</span>)}</div><div className="habit-detail-calendar">{Array.from({ length: monthOffset }, (_, index) => <span className="detail-day empty" key={`empty-${index}`} />)}{Array.from({ length: monthDays }, (_, index) => { const day = index + 1; const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day)); const checked = checkedDates.has(key); const isToday = key === dateKey(today); return <button aria-label={`${key}${checked ? '已完成' : '未完成'}`} aria-pressed={checked} className={`detail-day${checked ? ' checked' : ''}${isToday ? ' today' : ''}`} key={key} onClick={() => void toggleDate(key)} style={checked ? { '--detail-color': habit.color } as React.CSSProperties : undefined} type="button">{day}</button> })}</div><p className="detail-hint">点击日期可以补记或取消当天打卡。</p></section>}{tab === 'trend' && <section className="habit-detail-section"><div className="detail-section-heading"><h2>量化趋势</h2><span>近 30 天</span></div>{!habit.quantityEnabled ? <div className="detail-empty"><strong>还没有启用量化记录</strong><Link to={`/habits/${habit.id}/edit`}>去编辑习惯</Link></div> : <><div className="trend-summary"><strong>{formatNumber(quantityTotal)} {unit}</strong><span>历史累计 · 日均 {formatNumber(quantityTotal / Math.max(1, quantities.length))} {unit}</span></div><div className="quantity-chart" aria-label="近30天量化趋势">{trend.map((entry) => <div className="quantity-bar-column" key={entry.key} title={`${entry.key}：${entry.amount}${unit}`}><div className="quantity-bar-track"><span style={{ height: `${entry.amount ? Math.max(8, entry.amount / maxTrend * 100) : 2}%`, backgroundColor: habit.color }} /></div><small>{entry.day}</small></div>)}</div></>}</section>}{tab === 'more' && <section className="habit-detail-section detail-more"><h2>更多信息</h2><div className="detail-info-list"><div><span>情景</span><strong>{habit.context}</strong></div><div><span>循环模式</span><strong>{scheduleLabel(habit)}</strong></div><div><span>提醒</span><strong>{habit.reminderEnabled ? `${habit.reminderTime ?? ''} · 温柔提醒` : '未设置'}</strong></div><div><span>量化单位</span><strong>{habit.quantityEnabled ? `${unit} · 每次 ${habit.quantityIncrement ?? 1}${unit}` : '只记录完成状态'}</strong></div></div><Link className="primary-button full-width" to={`/habits/${habit.id}/edit`}>编辑习惯</Link></section>}</section>
}
