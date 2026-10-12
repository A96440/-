import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { setHabitEnabled } from '../../db/repositories'
import type { Habit } from '../../domain/types'

function scheduleLabel(habit: Habit): string {
  if (habit.scheduleType === 'daily') return '每天'
  if (habit.scheduleType === 'weeklyCount') return '每周' + (habit.scheduleConfig.count ?? 1) + '天'
  if (habit.scheduleType === 'monthlyCount') return '每月' + (habit.scheduleConfig.count ?? 1) + '天'
  if (habit.scheduleType === 'monthlyDate') return '每月' + (habit.scheduleConfig.day ?? 1) + '日'
  const count = habit.scheduleConfig.weekdays?.length ?? 0
  return count === 1 ? '每周固定 1 天' : '每周固定 ' + count + ' 天'
}

export function HabitsPage() {
  const habits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), [], [])
  async function toggleHabit(id: string, enabled: boolean) { await setHabitEnabled(id, enabled) }
  return <section className="page"><header className="page-header"><div><p className="eyebrow">建立你的节奏</p><h1>习惯管理</h1></div><Link className="primary-button" to="/habits/new">＋ 新习惯</Link></header>{habits.length === 0 ? <div className="empty-state"><span>🌱</span><h2>还没有习惯</h2><p>从一个想坚持的小事情开始吧。</p><Link className="primary-button" to="/habits/new">创建第一个习惯</Link></div> : <div className="habit-list">{habits.map((habit) => <article className={`habit-card${habit.enabled ? '' : ' disabled'}`} key={habit.id}><span className="habit-icon" style={{ backgroundColor: habit.color }}>{habit.icon}</span><Link className="habit-info" to={`/habits/${habit.id}/edit`}><strong>{habit.name}</strong><small>{scheduleLabel(habit)} · {habit.context}</small></Link><button className={`toggle${habit.enabled ? ' on' : ''}`} aria-label={`${habit.enabled ? '停用' : '启用'} ${habit.name}`} onClick={() => toggleHabit(habit.id, !habit.enabled)} type="button"><span /></button><Link aria-label={`编辑 ${habit.name}`} className="habit-arrow" to={`/habits/${habit.id}/edit`}>›</Link></article>)}</div>}</section>
}
