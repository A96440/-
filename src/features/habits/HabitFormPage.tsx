import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { createHabit, deleteHabit, saveHabit } from '../../db/repositories'
import type { Habit, ScheduleType } from '../../domain/types'

const colors = ['#b8d8ba', '#f4d5a6', '#d8c6e7', '#b8dce1', '#f1c2c2']
const icons = ['🌱', '🪴', '🌿', '🌻', '🌸', '🍀', '☀️', '🌙', '🧴', '🪥', '🧼', '🚿', '🛁', '💧', '🧹', '🧽', '🧺', '🧻', '🐈', '🐕', '🐾', '🦜', '🐠', '🏃', '🚶', '🧘', '🏋️', '🚴', '🏊', '🧗', '📚', '✍️', '🎸', '🎨', '🎵', '🎬', '💰', '💳', '🛒', '💊', '🩺', '🥗', '🍎', '☕', '🛌', '⏰', '📅', '🧠', '❤️', '⭐', '✅', '🔥', '📱', '💻', '✈️', '🏠', '🎮']
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const cycleTabs: { type: ScheduleType; label: string }[] = [{ type: 'daily', label: '每天' }, { type: 'weeklyDays', label: '每周定期' }, { type: 'weeklyCount', label: '每周N天' }, { type: 'monthlyDate', label: '每月定期' }, { type: 'monthlyCount', label: '每月N天' }]

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
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(existing?.scheduleConfig.weekdays ?? [1, 2, 3, 4, 5])
  const [scheduleCount, setScheduleCount] = useState(existing?.scheduleConfig.count ?? 1)
  const [scheduleDay, setScheduleDay] = useState(existing?.scheduleConfig.day ?? 1)
  const [icon, setIcon] = useState(existing?.icon ?? '🌱')
  const [color, setColor] = useState(existing?.color ?? colors[0])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || (scheduleType === 'weeklyDays' && selectedWeekdays.length === 0)) return
    const scheduleConfig = scheduleType === 'weeklyDays' ? { weekdays: selectedWeekdays } : scheduleType === 'weeklyCount' || scheduleType === 'monthlyCount' ? { count: scheduleCount } : scheduleType === 'monthlyDate' ? { day: scheduleDay } : {}
    if (existing) await saveHabit({ ...existing, name: name.trim(), context, scheduleType, scheduleConfig, icon, color, updatedAt: new Date().toISOString() })
    else await createHabit({ name: name.trim(), context, scheduleType, scheduleConfig, icon, color, enabled: true })
    navigate('/habits')
  }

  async function handleDelete() {
    if (!id || !window.confirm('删除后将同时移除该习惯的打卡记录，确定继续吗？')) return
    await deleteHabit(id)
    navigate('/habits')
  }

  function toggleWeekday(day: number) {
    setSelectedWeekdays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort())
  }

  return <section className="page form-page"><header className="page-header"><div><p className="eyebrow">{isEditing ? '调整一个习惯' : '从小事开始'}</p><h1>{isEditing ? '编辑习惯' : '新建习惯'}</h1></div><Link className="quiet-button" to="/habits">取消</Link></header><form className="habit-form" onSubmit={handleSubmit}>
    <label>名称<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：每日护肤" /></label>
    <fieldset><legend>图标</legend><div className="choice-grid">{icons.map((item) => <button className={item === icon ? 'choice selected' : 'choice'} key={item} onClick={() => setIcon(item)} type="button">{item}</button>)}</div></fieldset>
    <fieldset><legend>颜色</legend><div className="color-grid">{colors.map((item) => <button aria-label="选择颜色" className={item === color ? 'color-choice selected' : 'color-choice'} key={item} onClick={() => setColor(item)} style={{ backgroundColor: item }} type="button" />)}</div></fieldset>
    <label>场景<select onChange={(event) => setContext(event.target.value)} value={context}><option>全天</option><option>起床</option><option>晨间</option><option>中午</option><option>午间</option><option>晚间</option><option>睡前</option></select></label>
    <CyclePanel scheduleType={scheduleType} setScheduleType={setScheduleType} selectedWeekdays={selectedWeekdays} setSelectedWeekdays={setSelectedWeekdays} toggleWeekday={toggleWeekday} scheduleCount={scheduleCount} setScheduleCount={setScheduleCount} scheduleDay={scheduleDay} setScheduleDay={setScheduleDay} />
    <button className="primary-button full-width" disabled={!name.trim() || (scheduleType === 'weeklyDays' && selectedWeekdays.length === 0)} type="submit">保存习惯</button>{isEditing && <button className="danger-button" onClick={handleDelete} type="button">删除这个习惯</button>}
  </form></section>
}

function CyclePanel({ scheduleType, setScheduleType, selectedWeekdays, setSelectedWeekdays, toggleWeekday, scheduleCount, setScheduleCount, scheduleDay, setScheduleDay }: { scheduleType: ScheduleType; setScheduleType: (type: ScheduleType) => void; selectedWeekdays: number[]; setSelectedWeekdays: (days: number[]) => void; toggleWeekday: (day: number) => void; scheduleCount: number; setScheduleCount: (count: number) => void; scheduleDay: number; setScheduleDay: (day: number) => void }) {
  return <section className="cycle-panel"><div className="cycle-title"><span>▣ 循环模式</span><small>选择完成规则</small></div><div className="cycle-tabs">{cycleTabs.map((tab) => <button className={scheduleType === tab.type ? 'selected' : ''} key={tab.type} onClick={() => setScheduleType(tab.type)} type="button">{tab.label}</button>)}</div>{scheduleType === 'daily' && <div className="cycle-note">⟳ 每天打卡</div>}{scheduleType === 'weeklyDays' && <><div className="cycle-section-title"><strong>选择打卡日</strong><span>已选 {selectedWeekdays.length} 天</span></div><div className="weekday-grid cycle-weekdays">{weekdays.map((label, index) => { const day = index + 1 > 6 ? 0 : index + 1; return <button className={selectedWeekdays.includes(day) ? 'weekday selected' : 'weekday'} key={label} onClick={() => toggleWeekday(day)} type="button">{label}</button> })}</div><div className="quick-days"><button onClick={() => setSelectedWeekdays([1, 2, 3, 4, 5, 6, 0])} type="button">每天</button><button onClick={() => setSelectedWeekdays([1, 2, 3, 4, 5])} type="button">工作日</button><button onClick={() => setSelectedWeekdays([6, 0])} type="button">周末</button></div><div className="cycle-note">⟳ 每天打卡</div></>}{scheduleType === 'weeklyCount' && <><div className="cycle-section-title"><strong>每周打卡天数</strong><span>选择 1–7 天</span></div><div className="count-grid">{Array.from({ length: 7 }, (_, index) => index + 1).map((count) => <button className={scheduleCount === count ? 'selected' : ''} key={count} onClick={() => setScheduleCount(count)} type="button">{count}</button>)}</div><div className="cycle-note">⟳ 每周完成任意 {scheduleCount} 天即可</div></>}{scheduleType === 'monthlyDate' && <><div className="cycle-section-title"><strong>选择打卡日</strong><span>已选 {scheduleDay} 日</span></div><div className="month-day-grid">{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <button className={scheduleDay === day ? 'selected' : ''} key={day} onClick={() => setScheduleDay(day)} type="button">{day}</button>)}</div><div className="cycle-note">⟳ 每月 {scheduleDay} 日打卡</div></>}{scheduleType === 'monthlyCount' && <><div className="cycle-section-title"><strong>每月打卡天数</strong><span>自定义 1–31 天</span></div><div className="count-grid monthly-presets">{[5, 10, 15, 20, 25].map((count) => <button className={scheduleCount === count ? 'selected' : ''} key={count} onClick={() => setScheduleCount(count)} type="button">{count}</button>)}</div><div className="stepper-row"><span>自定义天数</span><div className="stepper"><button aria-label="减少天数" disabled={scheduleCount <= 1} onClick={() => setScheduleCount(Math.max(1, scheduleCount - 1))} type="button">−</button><strong>{scheduleCount}</strong><button aria-label="增加天数" disabled={scheduleCount >= 31} onClick={() => setScheduleCount(Math.min(31, scheduleCount + 1))} type="button">＋</button></div></div><div className="cycle-note">⟳ 每月完成任意 {scheduleCount} 天即可</div></>}</section>
}

