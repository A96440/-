import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { createHabit, deleteHabit, saveHabit } from '../../db/repositories'
import type { Habit, ScheduleType } from '../../domain/types'

const colors = ['#b8d8ba', '#f4d5a6', '#d8c6e7', '#b8dce1', '#f1c2c2']
const icons = ['🌱', '🪴', '🧴', '🪥', '🐈', '📚', '🏃', '💊']

export function HabitFormPage() {
  const { id } = useParams()
  const existing = useLiveQuery(() => id ? db.habits.get(id) : undefined, [id])
  if (id && existing === undefined) return <section className="page"><p className="eyebrow">正在读取</p><h1>习惯</h1></section>
  return <HabitFormFields existing={existing} id={id} key={existing?.id ?? 'new'} />
}

function HabitFormFields({ existing, id }: { existing?: Habit; id?: string }) {
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [name, setName] = useState(existing?.name ?? '')
  const [context, setContext] = useState(existing?.context ?? '睡前')
  const [scheduleType, setScheduleType] = useState<ScheduleType>(existing?.scheduleType ?? 'daily')
  const [icon, setIcon] = useState(existing?.icon ?? '🌱')
  const [color, setColor] = useState(existing?.color ?? colors[0])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    if (existing) await saveHabit({ ...existing, name: name.trim(), context, scheduleType, icon, color, updatedAt: new Date().toISOString() })
    else await createHabit({ name: name.trim(), context, scheduleType, scheduleConfig: scheduleType === 'weeklyDays' ? { weekdays: [1, 2, 3, 4, 5] } : {}, icon, color, enabled: true })
    navigate('/habits')
  }

  async function handleDelete() {
    if (!id || !window.confirm('删除后将同时移除该习惯的打卡记录，确定继续吗？')) return
    await deleteHabit(id)
    navigate('/habits')
  }

  return <section className="page form-page"><header className="page-header"><div><p className="eyebrow">{isEditing ? '调整一个习惯' : '从小事开始'}</p><h1>{isEditing ? '编辑习惯' : '新建习惯'}</h1></div><Link className="quiet-button" to="/habits">取消</Link></header><form className="habit-form" onSubmit={handleSubmit}><label>名称<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：每日护肤" /></label><fieldset><legend>图标</legend><div className="choice-grid">{icons.map((item) => <button className={item === icon ? 'choice selected' : 'choice'} key={item} onClick={() => setIcon(item)} type="button">{item}</button>)}</div></fieldset><fieldset><legend>颜色</legend><div className="color-grid">{colors.map((item) => <button aria-label="选择颜色" className={item === color ? 'color-choice selected' : 'color-choice'} key={item} onClick={() => setColor(item)} style={{ backgroundColor: item }} type="button" />)}</div></fieldset><label>场景<select onChange={(event) => setContext(event.target.value)} value={context}><option>全天</option><option>起床</option><option>晨间</option><option>中午</option><option>午间</option><option>晚间</option><option>睡前</option></select></label><label>循环<select onChange={(event) => setScheduleType(event.target.value as ScheduleType)} value={scheduleType}><option value="daily">每天</option><option value="weeklyDays">每周固定</option><option value="weeklyCount">每周 N 次</option><option value="monthlyDate">每月固定日期</option><option value="monthlyCount">每月 N 次</option></select></label><button className="primary-button full-width" disabled={!name.trim()} type="submit">保存习惯</button>{isEditing && <button className="danger-button" onClick={handleDelete} type="button">删除这个习惯</button>}</form></section>
}

