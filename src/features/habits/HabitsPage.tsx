import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { setHabitEnabled } from '../../db/repositories'
import type { Habit } from '../../domain/types'

const contextOrder = ['起床', '晨间', '上午', '中午', '午间', '下午', '晚间', '晚上', '睡前', '全天']

function scheduleLabel(habit: Habit): string {
  if (habit.scheduleType === 'daily') return '每天'
  if (habit.scheduleType === 'weeklyCount') return '每周' + (habit.scheduleConfig.count ?? 1) + '天'
  if (habit.scheduleType === 'monthlyCount') return '每月' + (habit.scheduleConfig.count ?? 1) + '天'
  if (habit.scheduleType === 'monthlyDate') return '每月固定' + (habit.scheduleConfig.day ?? 1) + '日'
  const count = habit.scheduleConfig.weekdays?.length ?? 0
  return count === 7 ? '每周每天' : '每周' + count + '天'
}

export function HabitsPage() {
  const navigate = useNavigate()
  const habits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), [], []) as Habit[]
  const [filter, setFilter] = useState('全部')
  const contexts = useMemo(() => ['全部', ...[...new Set(habits.map((habit) => habit.context))].sort((a, b) => (contextOrder.indexOf(a) + 1 || 99) - (contextOrder.indexOf(b) + 1 || 99))], [habits])
  const filtered = filter === '全部' ? habits : habits.filter((habit) => habit.context === filter)
  const grouped = [...new Set(filtered.map((habit) => habit.context))].sort((a, b) => (contextOrder.indexOf(a) + 1 || 99) - (contextOrder.indexOf(b) + 1 || 99))
  async function toggleHabit(id: string, enabled: boolean) { await setHabitEnabled(id, enabled) }
  function openHabit(id: string) { navigate(`/habits/${id}/edit`) }
  function handleKey(event: React.KeyboardEvent<HTMLElement>, id: string) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openHabit(id) } }

  return <section className="page habits-page"><header className="page-header"><div><p className="eyebrow">建立你的节奏</p><h1>打卡管理</h1></div><Link className="primary-button" to="/habits/new">＋ 新习惯</Link></header>{habits.length === 0 ? <div className="empty-state"><span>🌱</span><h2>还没有习惯</h2><p>从一个想坚持的小事情开始吧。</p><Link className="primary-button" to="/habits/new">创建第一个习惯</Link></div> : <><div aria-label="情景筛选" className="context-filter" role="tablist">{contexts.map((context) => <button aria-selected={filter === context} className={filter === context ? 'selected' : ''} key={context} onClick={() => setFilter(context)} role="tab" type="button">{context}{context !== '全部' && <small>({habits.filter((habit) => habit.context === context).length})</small>}</button>)}</div><div className="habit-groups">{grouped.map((context) => <section className="habit-group" key={context}><h2>{context}</h2><div className="habit-list">{filtered.filter((habit) => habit.context === context).map((habit) => <article className={`habit-card${habit.enabled ? '' : ' disabled'}`} key={habit.id} onClick={() => openHabit(habit.id)} onKeyDown={(event) => handleKey(event, habit.id)} role="link" tabIndex={0}><span className="habit-icon" style={{ backgroundColor: habit.color }}>{habit.icon}</span><div className="habit-info"><strong>{habit.name}</strong><small>{scheduleLabel(habit)} · {habit.context}{habit.quantityEnabled ? ` · 量化${habit.quantityDailyTarget ? ` / 日目标 ${habit.quantityDailyTarget}` : ''}` : ''}</small></div><button className={`toggle${habit.enabled ? ' on' : ''}`} aria-label={`${habit.enabled ? '停用' : '启用'} ${habit.name}`} onClick={(event) => { event.stopPropagation(); void toggleHabit(habit.id, !habit.enabled) }} type="button"><span /></button><span aria-hidden="true" className="habit-arrow">›</span></article>)}</div></section>)}</div></>}</section>
}
