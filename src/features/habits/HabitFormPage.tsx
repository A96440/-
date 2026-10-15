import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { createHabit, deleteHabit, saveHabit } from '../../db/repositories'
import { requestNotificationPermission } from '../../services/reminderService'
import type { Habit, QuantityUnit, ReminderRepeat, ScheduleType } from '../../domain/types'

const colors = ['#b8d8ba', '#f4d5a6', '#d8c6e7', '#b8dce1', '#f1c2c2']
const icons = ['🌱', '🪴', '🌿', '🌻', '🌸', '🍀', '🌷', '🌹', '🌼', '🪻', '🌾', '🍁', '🍂', '🌲', '🌳', '🎋', '☀️', '🌤️', '🌈', '🌙', '⭐', '✨', '❄️', '🌧️', '🧴', '🪥', '🧼', '🚿', '🛁', '💧', '🧹', '🧽', '🧺', '🧻', '🧯', '🪣', '🧰', '🔧', '🧷', '🪡', '🐈', '🐕', '🐾', '🦜', '🐠', '🐇', '🐢', '🦋', '🐝', '🐞', '🦄', '🏃', '🚶', '🧘', '🏋️', '🚴', '🏊', '🧗', '🤸', '⛹️', '🤾', '🧖', '🚶‍♀️', '📚', '✍️', '📝', '📖', '🎸', '🎨', '🎵', '🎬', '🎧', '🎤', '🎹', '🎮', '🎲', '🧩', '🎯', '🏆', '💰', '💳', '🛒', '🧾', '💊', '🩺', '🩹', '🧪', '🔬', '🥗', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍓', '🥕', '🌽', '🍞', '🥛', '🍵', '☕', '🍜', '🍣', '🍪', '🧁', '🛌', '⏰', '📅', '🧠', '❤️', '✅', '🔥', '📱', '💻', '⌨️', '🖨️', '✈️', '🚗', '🚲', '🚌', '🚇', '🧳', '🗺️', '🏠', '🛋️', '🛏️', '🧸', '🎁', '🏕️', '🏖️']
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const cycleTabs: { type: ScheduleType; label: string }[] = [{ type: 'daily', label: '每天' }, { type: 'weeklyDays', label: '每周定期' }, { type: 'weeklyCount', label: '每周N天' }, { type: 'monthlyDate', label: '每月定期' }, { type: 'monthlyCount', label: '每月N天' }, { type: 'intervalMonths', label: '每N个月' }, { type: 'yearlyCount', label: '每年N次' }]
const intervalPresets = [2, 3, 6, 12]

function CycleIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7.5 5V3M16.5 5V3M3.5 9.5h17M7 14h3M14 14h3M7 17h3" /></svg> }
function LoopIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 8a7 7 0 0 1 11.8-2L19 8" /><path d="M19 4v4h-4M19 16a7 7 0 0 1-11.8 2L5 16" /><path d="M5 20v-4h4" /></svg> }
function ReminderIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20h4M9 16h6" /></svg> }
function QuantityIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 4h12l-1 16H7L6 4Z" /><path d="M8 9h8M9 13h7M10 17h6" /></svg> }

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
  const [scheduleInterval, setScheduleInterval] = useState(existing?.scheduleConfig.intervalMonths ?? 3)
  const [customIntervalActive, setCustomIntervalActive] = useState(() => !intervalPresets.includes(existing?.scheduleConfig.intervalMonths ?? 3))
  const [icon, setIcon] = useState(existing?.icon ?? '🌱')
  const [color, setColor] = useState(existing?.color ?? colors[0])
  const [reminderEnabled, setReminderEnabled] = useState(existing?.reminderEnabled ?? false)
  const [reminderTime, setReminderTime] = useState(existing?.reminderTime ?? '20:00')
  const [reminderRepeat, setReminderRepeat] = useState<ReminderRepeat>(existing?.reminderRepeat ?? 'habit')
  const [reminderWeekdays, setReminderWeekdays] = useState<number[]>(existing?.reminderWeekdays ?? [1, 2, 3, 4, 5, 6, 0])
  const [reminderDay, setReminderDay] = useState(existing?.reminderDay ?? 1)
  const [reminderMonth, setReminderMonth] = useState(existing?.reminderMonth ?? 1)
  const [quantityEnabled, setQuantityEnabled] = useState(existing?.quantityEnabled ?? false)
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>(existing?.quantityUnit ?? '次')
  const [quantityCustomUnit, setQuantityCustomUnit] = useState(existing?.quantityCustomUnit ?? '')
  const [quantityIncrement, setQuantityIncrement] = useState(String(existing?.quantityIncrement ?? 1))
  const [quantityDailyTarget, setQuantityDailyTarget] = useState(existing?.quantityDailyTarget ? String(existing.quantityDailyTarget) : '')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || (scheduleType === 'weeklyDays' && selectedWeekdays.length === 0)) return
    const scheduleConfig = scheduleType === 'weeklyDays' ? { weekdays: selectedWeekdays } : scheduleType === 'weeklyCount' || scheduleType === 'monthlyCount' || scheduleType === 'yearlyCount' ? { count: scheduleCount } : scheduleType === 'monthlyDate' ? { day: scheduleDay } : scheduleType === 'intervalMonths' ? { intervalMonths: scheduleInterval, day: scheduleDay } : {}
    const parsedIncrement = Math.max(0.01, Number(quantityIncrement) || 1)
    const parsedTarget = quantityDailyTarget.trim() ? Math.max(0.01, Number(quantityDailyTarget) || 0) : undefined
    const common = { name: name.trim(), context, scheduleType, scheduleConfig, icon, color, reminderEnabled, reminderTime, reminderMode: 'gentle' as const, reminderRepeat, reminderWeekdays: reminderRepeat === 'custom' ? reminderWeekdays : undefined, reminderDay: reminderRepeat === 'monthlyDate' || reminderRepeat === 'yearlyDate' ? reminderDay : undefined, reminderMonth: reminderRepeat === 'yearlyDate' ? reminderMonth : undefined, quantityEnabled, quantityUnit, quantityCustomUnit: quantityUnit === 'custom' ? quantityCustomUnit.trim() : undefined, quantityIncrement: parsedIncrement, quantityDailyTarget: parsedTarget }
    if (existing) await saveHabit({ ...existing, ...common, updatedAt: new Date().toISOString() })
    else await createHabit({ ...common, enabled: true })
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

  async function toggleReminder() {
    if (!reminderEnabled) await requestNotificationPermission()
    setReminderEnabled((value) => !value)
  }

  function toggleReminderWeekday(day: number) {
    setReminderWeekdays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort())
  }

  return <section className="page form-page"><header className="page-header"><div><p className="eyebrow">{isEditing ? '调整一个习惯' : '从小事开始'}</p><h1>{isEditing ? '编辑习惯' : '新建习惯'}</h1></div><Link className="quiet-button" to="/habits">取消</Link></header><form className="habit-form" onSubmit={handleSubmit}>
    <label>名称<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：每日护肤" /></label>
    <fieldset><legend>图标</legend><div className="choice-grid">{icons.map((item) => <button className={item === icon ? 'choice selected' : 'choice'} key={item} onClick={() => setIcon(item)} type="button">{item}</button>)}</div></fieldset>
    <fieldset><legend>颜色</legend><div className="color-grid">{colors.map((item) => <button aria-label="选择颜色" className={item === color ? 'color-choice selected' : 'color-choice'} key={item} onClick={() => setColor(item)} style={{ backgroundColor: item }} type="button" />)}</div></fieldset>
    <label>场景<select onChange={(event) => setContext(event.target.value)} value={context}><option>全天</option><option>起床</option><option>晨间</option><option>中午</option><option>午间</option><option>晚间</option><option>睡前</option></select></label>
    <CyclePanel scheduleType={scheduleType} setScheduleType={setScheduleType} selectedWeekdays={selectedWeekdays} setSelectedWeekdays={setSelectedWeekdays} toggleWeekday={toggleWeekday} scheduleCount={scheduleCount} setScheduleCount={setScheduleCount} scheduleDay={scheduleDay} setScheduleDay={setScheduleDay} scheduleInterval={scheduleInterval} setScheduleInterval={setScheduleInterval} customIntervalActive={customIntervalActive} setCustomIntervalActive={setCustomIntervalActive} />
    <ReminderPanel enabled={reminderEnabled} onToggle={toggleReminder} time={reminderTime} setTime={setReminderTime} repeat={reminderRepeat} setRepeat={setReminderRepeat} weekdays={reminderWeekdays} toggleWeekday={toggleReminderWeekday} day={reminderDay} setDay={setReminderDay} month={reminderMonth} setMonth={setReminderMonth} />
    <QuantityPanel enabled={quantityEnabled} setEnabled={setQuantityEnabled} unit={quantityUnit} setUnit={setQuantityUnit} customUnit={quantityCustomUnit} setCustomUnit={setQuantityCustomUnit} increment={quantityIncrement} setIncrement={setQuantityIncrement} target={quantityDailyTarget} setTarget={setQuantityDailyTarget} />
    <button className="primary-button full-width" disabled={!name.trim() || (scheduleType === 'weeklyDays' && selectedWeekdays.length === 0)} type="submit">保存习惯</button>{isEditing && <button className="danger-button" onClick={handleDelete} type="button">删除这个习惯</button>}
  </form></section>
}

function CyclePanel({ scheduleType, setScheduleType, selectedWeekdays, setSelectedWeekdays, toggleWeekday, scheduleCount, setScheduleCount, scheduleDay, setScheduleDay, scheduleInterval, setScheduleInterval, customIntervalActive, setCustomIntervalActive }: { scheduleType: ScheduleType; setScheduleType: (type: ScheduleType) => void; selectedWeekdays: number[]; setSelectedWeekdays: (days: number[]) => void; toggleWeekday: (day: number) => void; scheduleCount: number; setScheduleCount: (count: number) => void; scheduleDay: number; setScheduleDay: (day: number) => void; scheduleInterval: number; setScheduleInterval: (months: number) => void; customIntervalActive: boolean; setCustomIntervalActive: (value: boolean) => void }) {
  return <section className="cycle-panel"><div className="cycle-title"><span className="cycle-icon"><CycleIcon /> 循环模式</span><small>选择完成规则</small></div><div className="cycle-tabs">{cycleTabs.map((tab) => <button className={scheduleType === tab.type ? 'selected' : ''} key={tab.type} onClick={() => setScheduleType(tab.type)} type="button">{tab.label}</button>)}</div>{scheduleType === 'daily' && <div className="cycle-note"><LoopIcon /> 每天打卡</div>}{scheduleType === 'weeklyDays' && <><div className="cycle-section-title"><strong>选择打卡日</strong><span>已选 {selectedWeekdays.length} 天</span></div><div className="weekday-grid cycle-weekdays">{weekdays.map((label, index) => { const day = index + 1 > 6 ? 0 : index + 1; return <button className={selectedWeekdays.includes(day) ? 'weekday selected' : 'weekday'} key={label} onClick={() => toggleWeekday(day)} type="button">{label}</button> })}</div><div className="quick-days"><button onClick={() => setSelectedWeekdays([1, 2, 3, 4, 5, 6, 0])} type="button">每天</button><button onClick={() => setSelectedWeekdays([1, 2, 3, 4, 5])} type="button">工作日</button><button onClick={() => setSelectedWeekdays([6, 0])} type="button">周末</button></div><div className="cycle-note"><LoopIcon /> 每天打卡</div></>}{scheduleType === 'weeklyCount' && <><div className="cycle-section-title"><strong>每周打卡天数</strong><span>选择 1–7 天</span></div><div className="count-grid">{Array.from({ length: 7 }, (_, index) => index + 1).map((count) => <button className={scheduleCount === count ? 'selected' : ''} key={count} onClick={() => setScheduleCount(count)} type="button">{count}</button>)}</div><div className="cycle-note"><LoopIcon /> 每周完成任意 {scheduleCount} 天即可</div></>}{scheduleType === 'monthlyDate' && <><div className="cycle-section-title"><strong>选择打卡日</strong><span>已选 {scheduleDay} 日</span></div><div className="month-day-grid">{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <button className={scheduleDay === day ? 'selected' : ''} key={day} onClick={() => setScheduleDay(day)} type="button">{day}</button>)}</div><div className="cycle-note"><LoopIcon /> 每月 {scheduleDay} 日打卡</div></>}{scheduleType === 'monthlyCount' && <><div className="cycle-section-title"><strong>每月打卡天数</strong><span>自定义 1–31 天</span></div><div className="count-grid monthly-presets">{[5, 10, 15, 20, 25].map((count) => <button className={scheduleCount === count ? 'selected' : ''} key={count} onClick={() => setScheduleCount(count)} type="button">{count}</button>)}</div><div className="stepper-row"><span>自定义天数</span><div className="stepper"><button aria-label="减少天数" disabled={scheduleCount <= 1} onClick={() => setScheduleCount(Math.max(1, scheduleCount - 1))} type="button">−</button><strong>{scheduleCount}</strong><button aria-label="增加天数" disabled={scheduleCount >= 31} onClick={() => setScheduleCount(Math.min(31, scheduleCount + 1))} type="button">＋</button></div></div><div className="cycle-note"><LoopIcon /> 每月完成任意 {scheduleCount} 天即可</div></>}{scheduleType === 'intervalMonths' && <><div className="cycle-section-title"><strong>间隔月数</strong><span>例如每 3 个月一次</span></div><div className="count-grid interval-grid">{intervalPresets.map((months) => <button className={!customIntervalActive && scheduleInterval === months ? 'selected' : ''} key={months} onClick={() => { setCustomIntervalActive(false); setScheduleInterval(months) }} type="button">{months}个月</button>)}<button className={customIntervalActive ? 'selected' : ''} onClick={() => setCustomIntervalActive(true)} type="button">自定义</button></div>{customIntervalActive && <label className="interval-custom-input">自定义月数<input max="120" min="1" onChange={(event) => setScheduleInterval(Math.min(120, Math.max(1, Number(event.target.value) || 1)))} type="number" value={scheduleInterval} /><span>个月</span></label>}<div className="cycle-section-title"><strong>周期日期</strong><span>每周期第 {scheduleDay} 日</span></div><div className="month-day-grid">{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <button className={scheduleDay === day ? 'selected' : ''} key={day} onClick={() => setScheduleDay(day)} type="button">{day}</button>)}</div><div className="cycle-note"><LoopIcon /> 每 {scheduleInterval} 个月一次</div></>}{scheduleType === 'yearlyCount' && <><div className="cycle-section-title"><strong>每年完成次数</strong><span>完成后本年度不再显示</span></div><div className="count-grid">{Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <button className={scheduleCount === count ? 'selected' : ''} key={count} onClick={() => setScheduleCount(count)} type="button">{count}</button>)}</div><div className="cycle-note"><LoopIcon /> 每年完成任意 {scheduleCount} 次即可</div></>}</section>
}

const reminderWeekdayLabels = ['一', '二', '三', '四', '五', '六', '日']
const reminderRepeatLabels: { value: ReminderRepeat; label: string }[] = [{ value: 'habit', label: '跟随循环' }, { value: 'daily', label: '每天' }, { value: 'workdays', label: '工作日' }, { value: 'weekends', label: '周末' }, { value: 'custom', label: '每周自定义' }, { value: 'monthlyDate', label: '每月固定日' }, { value: 'yearlyDate', label: '每年固定日' }]

function ReminderPanel({ enabled, onToggle, time, setTime, repeat, setRepeat, weekdays: selectedWeekdays, toggleWeekday, day, setDay, month, setMonth }: { enabled: boolean; onToggle: () => void; time: string; setTime: (value: string) => void; repeat: ReminderRepeat; setRepeat: (value: ReminderRepeat) => void; weekdays: number[]; toggleWeekday: (day: number) => void; day: number; setDay: (value: number) => void; month: number; setMonth: (value: number) => void }) {
  return <section className="reminder-panel"><div className="panel-heading"><span><span className="panel-icon"><ReminderIcon /></span>提醒</span><button aria-pressed={enabled} className={`switch${enabled ? ' on' : ''}`} onClick={onToggle} type="button"><span /></button></div><div className="reminder-time-row"><label>提醒时间<input aria-label="提醒时间" onChange={(event) => setTime(event.target.value)} type="time" value={time} /></label><small>温柔提醒 · 通过系统通知</small></div><div className="repeat-block"><strong>重复周期</strong><div className="repeat-tabs">{reminderRepeatLabels.map((item) => <button className={repeat === item.value ? 'selected' : ''} key={item.value} onClick={() => setRepeat(item.value)} type="button">{item.label}</button>)}</div>{repeat === 'habit' && <p className="quantity-hint">跟随上面的循环模式，到期时提醒</p>}{repeat === 'custom' && <div className="weekday-grid reminder-weekdays">{reminderWeekdayLabels.map((label, index) => { const selectedDay = index + 1 > 6 ? 0 : index + 1; return <button className={selectedWeekdays.includes(selectedDay) ? 'weekday selected' : 'weekday'} key={label} onClick={() => toggleWeekday(selectedDay)} type="button">{label}</button> })}</div>}{repeat === 'monthlyDate' && <div className="reminder-date-row"><span>每月</span><input aria-label="每月提醒日期" max="31" min="1" onChange={(event) => setDay(Math.min(31, Math.max(1, Number(event.target.value) || 1)))} type="number" value={day} /><span>日</span></div>}{repeat === 'yearlyDate' && <div className="reminder-date-row"><select aria-label="每年提醒月份" onChange={(event) => setMonth(Number(event.target.value))} value={month}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} 月</option>)}</select><input aria-label="每年提醒日期" max="31" min="1" onChange={(event) => setDay(Math.min(31, Math.max(1, Number(event.target.value) || 1)))} type="number" value={day} /><span>日</span></div>}</div></section>
}

const quantityUnits: { value: QuantityUnit; label: string }[] = [{ value: 'custom', label: '自定义' }, { value: '次', label: '次' }, { value: '杯', label: '杯' }, { value: '毫升', label: '毫升' }, { value: '分钟', label: '分钟' }, { value: '小时', label: '小时' }, { value: '公里', label: '公里' }, { value: '米', label: '米' }, { value: '步', label: '步' }, { value: '页', label: '页' }, { value: '组', label: '组' }, { value: '颗', label: '颗' }]

function QuantityPanel({ enabled, setEnabled, unit, setUnit, customUnit, setCustomUnit, increment, setIncrement, target, setTarget }: { enabled: boolean; setEnabled: (value: boolean) => void; unit: QuantityUnit; setUnit: (value: QuantityUnit) => void; customUnit: string; setCustomUnit: (value: string) => void; increment: string; setIncrement: (value: string) => void; target: string; setTarget: (value: string) => void }) {
  return <section className="quantity-panel"><div className="panel-heading"><span><span className="panel-icon"><QuantityIcon /></span>量化记录</span><button aria-pressed={enabled} className={`switch${enabled ? ' on' : ''}`} onClick={() => setEnabled(!enabled)} type="button"><span /></button></div>{enabled ? <><label className="quantity-label">单位<div className="quantity-unit-grid">{quantityUnits.map((item) => <button className={unit === item.value ? 'selected' : ''} key={item.value} onClick={() => setUnit(item.value)} type="button">{item.label}</button>)}</div></label>{unit === 'custom' && <label className="quantity-custom-label">自定义单位<input maxLength={8} onChange={(event) => setCustomUnit(event.target.value)} placeholder="例如：粒" value={customUnit} /></label>}<div className="quantity-inputs"><label>每次增加<input min="0.01" onChange={(event) => setIncrement(event.target.value)} step="any" type="number" value={increment} /><span>{unit === 'custom' ? customUnit || '单位' : unit}</span></label><label>每日目标 <small>（可选）</small><input min="0.01" onChange={(event) => setTarget(event.target.value)} placeholder="—" step="any" type="number" value={target} /><span>{unit === 'custom' ? customUnit || '单位' : unit}</span></label></div><p className="quantity-hint">点击首页“＋”按钮，增加 {increment || 1}{unit === 'custom' ? customUnit || '单位' : unit}</p></> : <p className="quantity-disabled-note">当前只记录完成状态</p>}</section>
}

