import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { setCheck, setQuantity } from '../../db/repositories'
import { dateKey, daysInMonth } from '../../domain/schedule'
import type { CheckRecord, Habit } from '../../domain/types'

type DetailTab = 'calendar' | 'trend' | 'more'
type TrendRange = 7 | 30 | 90 | 'month'
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
  const [trendRange, setTrendRange] = useState<TrendRange>(30)
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
  const trendLength = trendRange === 'month' ? today.getDate() : trendRange
  const trendStart = trendRange === 'month' ? new Date(today.getFullYear(), today.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), today.getDate() - (trendLength - 1))
  const trend = Array.from({ length: trendLength }, (_, index) => {
    const date = new Date(trendStart.getFullYear(), trendStart.getMonth(), trendStart.getDate() + index)
    const key = dateKey(date)
    return { key, label: trendRange === 'month' || trendRange === 7 ? String(date.getDate()) : `${date.getMonth() + 1}/${date.getDate()}`, amount: quantities.find((record) => record.date === key)?.amount ?? 0 }
  })
  const trendTotal = trend.reduce((sum, entry) => sum + entry.amount, 0)
  const trendAverage = trendTotal / Math.max(1, trend.filter((entry) => entry.amount > 0).length)
  const maxTrend = Math.max(1, ...trend.map((entry) => entry.amount))
  const chartLeft = 30
  const chartRight = 352
  const chartTop = 12
  const chartBottom = 166
  const chartHeight = chartBottom - chartTop
  const chartPoints = trend.map((entry, index) => {
    const x = trend.length === 1 ? chartLeft : chartLeft + (chartRight - chartLeft) * index / (trend.length - 1)
    const y = chartBottom - (entry.amount / maxTrend) * chartHeight
    return { ...entry, x, y }
  })
  const linePath = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L ${chartPoints.at(-1)?.x ?? chartRight} ${chartBottom} L ${chartPoints[0]?.x ?? chartLeft} ${chartBottom} Z`
  const labelIndexes = [...new Set([0, Math.floor((trend.length - 1) / 3), Math.floor((trend.length - 1) * 2 / 3), trend.length - 1])]

  async function toggleDate(key: string) {
    await setCheck(habit.id, new Date(`${key}T12:00:00`), !checkedDates.has(key))
  }

  function moveMonth(amount: number) { setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1)) }

  return <section className="page habit-detail-page"><header className="page-header"><div><Link className="back-link" to="/habits">← 返回打卡管理</Link></div><Link aria-label="编辑习惯" className="icon-button" to={`/habits/${habit.id}/edit`}>✎</Link></header><section className="habit-detail-hero"><span className="habit-detail-icon" style={{ backgroundColor: habit.color }}>{habit.icon}</span><h1>{habit.name}</h1><span className="habit-detail-schedule">{scheduleLabel(habit)}</span></section><div className="habit-stat-grid"><div><strong>{completed.length}</strong><span>总完成</span></div><div><strong>{habit.quantityEnabled ? `${formatNumber(quantityTotal)}${unit}` : '—'}</strong><span>量化记录</span></div><div><strong>{completedStreak(checks)}天</strong><span>连续完成</span></div><div><strong>{monthCompleted}天</strong><span>本月完成</span></div></div><div aria-label="习惯详情标签" className="habit-detail-tabs" role="tablist"><button aria-selected={tab === 'calendar'} className={tab === 'calendar' ? 'selected' : ''} onClick={() => setTab('calendar')} role="tab" type="button">打卡日历</button><button aria-selected={tab === 'trend'} className={tab === 'trend' ? 'selected' : ''} onClick={() => setTab('trend')} role="tab" type="button">量化趋势</button><button aria-selected={tab === 'more'} className={tab === 'more' ? 'selected' : ''} onClick={() => setTab('more')} role="tab" type="button">其它</button></div>{tab === 'calendar' && <section className="habit-detail-section"><div className="detail-section-heading"><h2>打卡日历</h2><div className="month-nav"><button aria-label="上个月" onClick={() => moveMonth(-1)} type="button">‹</button><strong>{month.getFullYear()}年{month.getMonth() + 1}月</strong><button aria-label="下个月" onClick={() => moveMonth(1)} type="button">›</button></div></div><div className="detail-weekdays">{dayLabels.map((label) => <span key={label}>周{label}</span>)}</div><div className="habit-detail-calendar">{Array.from({ length: monthOffset }, (_, index) => <span className="detail-day empty" key={`empty-${index}`} />)}{Array.from({ length: monthDays }, (_, index) => { const day = index + 1; const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day)); const checked = checkedDates.has(key); const isToday = key === dateKey(today); return <button aria-label={`${key}${checked ? '已完成' : '未完成'}`} aria-pressed={checked} className={`detail-day${checked ? ' checked' : ''}${isToday ? ' today' : ''}`} key={key} onClick={() => void toggleDate(key)} style={checked ? { '--detail-color': habit.color } as React.CSSProperties : undefined} type="button">{day}</button> })}</div><p className="detail-hint">点击日期可以补记或取消当天打卡。</p></section>}{tab === 'trend' && <section className="habit-detail-section"><div className="detail-section-heading"><h2>量化趋势</h2><span>趋势范围</span></div>{!habit.quantityEnabled ? <div className="detail-empty"><strong>还没有启用量化记录</strong><Link to={`/habits/${habit.id}/edit`}>去编辑习惯</Link></div> : <><div className="trend-range-tabs">{([7, 30, 90, 'month'] as const).map((range) => <button className={trendRange === range ? 'selected' : ''} key={String(range)} onClick={() => setTrendRange(range)} type="button">{range === 'month' ? '本月' : `${range}天`}</button>)}</div><div className="trend-summary"><strong>{formatNumber(trendTotal)} {unit}</strong><span>{trendRange === 'month' ? '本月累计' : `近${trendRange}天累计`} · 日均 {formatNumber(trendAverage)} {unit}</span></div><div className="quantity-line-chart" aria-label="量化趋势图"><svg preserveAspectRatio="none" viewBox="0 0 360 190"><g className="chart-grid-lines">{[0, .25, .5, .75, 1].map((ratio) => { const y = chartBottom - ratio * chartHeight; return <line key={ratio} x1={chartLeft} x2={chartRight} y1={y} y2={y} /> })}</g><path className="chart-area" d={areaPath} /><path className="chart-line" d={linePath} />{chartPoints.filter((point) => point.amount > 0).map((point) => <circle cx={point.x} cy={point.y} key={point.key} r="4" />)}<g className="chart-y-labels">{[1, .75, .5, .25, 0].map((value) => <text key={value} x="2" y={chartBottom - value * chartHeight + 4}>{formatNumber(value * maxTrend)}</text>)}</g><g className="chart-x-labels">{labelIndexes.map((index) => <text key={index} textAnchor="middle" x={chartPoints[index]?.x ?? chartLeft} y="186">{chartPoints[index]?.label}</text>)}</g></svg></div></>}</section>}{tab === 'more' && <section className="habit-detail-section detail-more"><h2>更多信息</h2><div className="detail-info-list"><div><span>情景</span><strong>{habit.context}</strong></div><div><span>循环模式</span><strong>{scheduleLabel(habit)}</strong></div><div><span>提醒</span><strong>{habit.reminderEnabled ? `${habit.reminderTime ?? ''} · 温柔提醒` : '未设置'}</strong></div><div><span>量化单位</span><strong>{habit.quantityEnabled ? `${unit} · 每次 ${habit.quantityIncrement ?? 1}${unit}` : '只记录完成状态'}</strong></div></div><Link className="primary-button full-width" to={`/habits/${habit.id}/edit`}>编辑习惯</Link></section>}</section>
}
