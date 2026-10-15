import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { createBirthday, createLifeItem, createMemo, deleteLifeItem, deleteMemo, saveLifeItem, saveMemo, toggleLifeItem } from '../../db/repositories'
import { daysUntil, lunarDayLabel, lunarMonthLabel, nextBirthdayDate } from '../../domain/sticky'
import type { CalendarType, LifeItem, Memo } from '../../domain/types'

const stickyColors = ['#dce8f3', '#e4efdf', '#f8edc9', '#f3dfdf']
type Composer = 'life' | 'memo' | 'birthday' | null

function formatDate(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(value))
}

export function StickyPage() {
  const projectsQuery = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray(), [])
  const nodesQuery = useLiveQuery(() => db.projectNodes.toArray(), [])
  const lifeQuery = useLiveQuery(() => db.lifeItems.orderBy('updatedAt').reverse().toArray(), [])
  const memosQuery = useLiveQuery(() => db.memos.orderBy('updatedAt').reverse().toArray(), [])
  const birthdaysQuery = useLiveQuery(() => db.birthdays.orderBy('month').toArray(), [])
  const [composer, setComposer] = useState<Composer>(null)
  const [editingMemo, setEditingMemo] = useState<Memo | undefined>()
  const [editingLife, setEditingLife] = useState<LifeItem | undefined>()
  const loading = [projectsQuery, nodesQuery, lifeQuery, memosQuery, birthdaysQuery].some((value) => value === undefined)
  const projects = projectsQuery ?? []
  const nodes = nodesQuery ?? []
  const lifeItems = lifeQuery ?? []
  const memos = memosQuery ?? []
  const birthdays = birthdaysQuery ?? []
  const activeProjects = projects.filter((project) => project.status === 'active')
  const completedProjects = projects.filter((project) => project.status === 'completed')
  const activeLife = lifeItems.filter((item) => item.status === 'active')
  const completedLife = lifeItems.filter((item) => item.status === 'completed')
  const activeMemos = memos.filter((memo) => memo.status === 'active')
  const upcomingBirthdays = birthdays.map((birthday) => ({ birthday, date: nextBirthdayDate(birthday) })).sort((a, b) => a.date.getTime() - b.date.getTime())

  if (loading) return <section className="page sticky-page loading-page" aria-busy="true"><header className="page-header"><div><p className="eyebrow">正在整理</p><h1>便利贴</h1></div></header><div className="sticky-quadrants"><div className="loading-card" /><div className="loading-card" /><div className="loading-card" /><div className="loading-card" /></div></section>

  const closeComposer = () => { setComposer(null); setEditingMemo(undefined); setEditingLife(undefined) }

  return <section className="page sticky-page"><header className="page-header sticky-header"><div><p className="eyebrow">把事情放在合适的位置</p><h1>便利贴</h1></div><Link aria-label="新建便利贴" className="icon-button" to="/stickies/new">＋</Link></header><div className="sticky-quadrants">
    <section className="sticky-quadrant work-quadrant"><QuadrantHeader icon="▦" title="工作项目" count={activeProjects.length} to="/stickies/work" /><div className="sticky-preview-list">{activeProjects.slice(0, 3).map((project) => { const projectNodes = nodes.filter((node) => node.projectId === project.id).sort((a, b) => a.position - b.position); const done = projectNodes.filter((node) => node.status === 'completed').length; const next = projectNodes.find((node) => node.status === 'pending'); return <Link className="sticky-preview project-preview" key={project.id} to={`/stickies/projects/${project.id}`}><strong>{project.name}</strong><span className="project-progress-label">进度 {done}/{projectNodes.length || 0}</span><span>{next ? `下一步：${next.title}` : projectNodes.length ? '全部节点已完成' : '还没有节点'}</span></Link> })}</div>{activeProjects.length === 0 && <EmptyQuadrant text="还没有工作项目" />}</section>
    <section className="sticky-quadrant life-quadrant"><QuadrantHeader icon="⌂" title="生活" count={activeLife.length} /><div className="sticky-preview-list">{activeLife.slice(0, 3).map((item) => <div className="sticky-preview life-preview" key={item.id}><button aria-label={`完成 ${item.title}`} className="sticky-check" onClick={() => void toggleLifeItem(item.id)} type="button">○</button><button className="life-preview-copy" onClick={() => { setEditingLife(item); setComposer('life') }} type="button"><strong>{item.title}</strong>{item.dueAt && <small>{formatDate(item.dueAt)}</small>}</button></div>)}</div>{activeLife.length === 0 && <EmptyQuadrant text="还没有生活事项" />}</section>
    <section className="sticky-quadrant memo-quadrant"><QuadrantHeader icon="✎" title="灵感速记" count={activeMemos.length} /><div className="sticky-preview-list">{activeMemos.slice(0, 3).map((memo) => <button className="sticky-preview memo-preview" key={memo.id} onClick={() => { setEditingMemo(memo); setComposer('memo') }} style={{ '--sticky-color': memo.color } as React.CSSProperties} type="button"><strong>{memo.title}</strong><span>{memo.content || '暂无内容'}</span></button>)}</div>{activeMemos.length === 0 && <EmptyQuadrant text="记录突然想到的事情" />}</section>
    <section className="sticky-quadrant birthday-quadrant"><QuadrantHeader icon="♡" title="生日" count={upcomingBirthdays.length} /><div className="sticky-preview-list">{upcomingBirthdays.slice(0, 3).map(({ birthday, date }) => <div className="sticky-preview birthday-preview" key={birthday.id}><strong>{birthday.name}</strong><span>{birthday.calendarType === 'lunar' ? `农历${lunarMonthLabel(birthday.month)}${lunarDayLabel(birthday.day)}` : `公历${birthday.month}月${birthday.day}日`}</span><small>还有 {daysUntil(date)} 天</small></div>)}</div>{upcomingBirthdays.length === 0 && <EmptyQuadrant text="添加一个重要的生日" />}</section>
  </div>{(completedProjects.length > 0 || completedLife.length > 0) && <section className="sticky-completed-section"><div className="sticky-section-heading"><h2>已完成</h2><span>{completedProjects.length + completedLife.length} 项</span></div>{completedProjects.map((project) => <Link className="completed-sticky-row" key={project.id} to={`/stickies/projects/${project.id}`}><span>✓</span><strong>{project.name}</strong><small>项目已完成</small></Link>)}{completedLife.map((item) => <div className="completed-sticky-row" key={item.id}><button aria-label={`恢复 ${item.title}`} onClick={() => void toggleLifeItem(item.id)} type="button">✓</button><strong>{item.title}</strong><small>生活事项</small><button aria-label={`删除 ${item.title}`} onClick={() => { if (window.confirm('确定删除这项生活事项吗？')) void deleteLifeItem(item.id) }} type="button">×</button></div>)}</section>}{composer === 'life' && <LifeComposer onClose={closeComposer} item={editingLife} />}{composer === 'memo' && <MemoComposer onClose={closeComposer} memo={editingMemo} />}{composer === 'birthday' && <BirthdayComposer onClose={closeComposer} />}</section>
}

function QuadrantHeader({ icon, title, count, to }: { icon: string; title: string; count: number; to?: string }) {
  const heading = <h2><span>{icon}</span>{title}<small>{count}</small></h2>
  return <div className="quadrant-heading">{to ? <Link className="quadrant-title-link" to={to}>{heading}</Link> : heading}</div>
}
function EmptyQuadrant({ text }: { text: string }) { return <p className="quadrant-empty">{text}</p> }

function ComposerShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="composer-backdrop" onClick={onClose}><section aria-modal="true" className="composer-sheet" onClick={(event) => event.stopPropagation()} role="dialog"><header><h2>{title}</h2><button aria-label="关闭" onClick={onClose} type="button">×</button></header>{children}</section></div>
}

export function LifeComposer({ onClose, item }: { onClose: () => void; item?: LifeItem }) {
  const [title, setTitle] = useState(item?.title ?? ''); const [note, setNote] = useState(item?.note ?? ''); const [dueAt, setDueAt] = useState(item?.dueAt ?? '')
  async function submit(event: FormEvent) { event.preventDefault(); if (!title.trim()) return; if (item) await saveLifeItem({ ...item, title: title.trim(), note: note.trim() || undefined, dueAt: dueAt || undefined }); else await createLifeItem(title, note, dueAt); onClose() }
  async function remove() { if (item && window.confirm('确定删除这项生活事项吗？')) { await deleteLifeItem(item.id); onClose() } }
  return <ComposerShell title={item ? '编辑生活事项' : '新增生活事项'} onClose={onClose}><form className="sticky-form" onSubmit={submit}><label>事项<input autoFocus onChange={(event) => setTitle(event.target.value)} placeholder="例如：买猫砂" value={title} /></label><label>备注<textarea onChange={(event) => setNote(event.target.value)} placeholder="可选" value={note} /></label><label>截止时间<input onChange={(event) => setDueAt(event.target.value)} type="datetime-local" value={dueAt} /></label><button className="primary-button full-width" type="submit">保存</button>{item && <button className="danger-button" onClick={() => void remove()} type="button">删除事项</button>}</form></ComposerShell>
}

export function MemoComposer({ onClose, memo }: { onClose: () => void; memo?: Memo }) {
  const [title, setTitle] = useState(memo?.title ?? ''); const [content, setContent] = useState(memo?.content ?? ''); const [color, setColor] = useState(memo?.color ?? stickyColors[2])
  async function submit(event: FormEvent) { event.preventDefault(); if (!title.trim()) return; if (memo) await saveMemo({ ...memo, title: title.trim(), content, color }); else await createMemo(title, content, color); onClose() }
  async function remove() { if (memo && window.confirm('确定删除这条速记吗？')) { await deleteMemo(memo.id); onClose() } }
  return <ComposerShell title={memo ? '编辑速记' : '新增灵感速记'} onClose={onClose}><form className="sticky-form" onSubmit={submit}><label>标题<input autoFocus onChange={(event) => setTitle(event.target.value)} value={title} /></label><label>内容<textarea onChange={(event) => setContent(event.target.value)} placeholder="记录一个想法、数据或备忘" value={content} /></label><div className="sticky-color-picker">{stickyColors.map((item) => <button aria-label="选择颜色" className={color === item ? 'selected' : ''} key={item} onClick={() => setColor(item)} style={{ backgroundColor: item }} type="button" />)}</div><button className="primary-button full-width" type="submit">保存</button>{memo && <button className="danger-button" onClick={() => void remove()} type="button">删除速记</button>}</form></ComposerShell>
}

export function BirthdayComposer({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState(''); const [relation, setRelation] = useState(''); const [calendarType, setCalendarType] = useState<CalendarType>('gregorian'); const [month, setMonth] = useState(1); const [day, setDay] = useState(1); const [offsets, setOffsets] = useState([7, 3, 0])
  function toggleOffset(value: number) { setOffsets((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value].sort((a, b) => b - a)) }
  async function submit(event: FormEvent) { event.preventDefault(); if (!name.trim()) return; await createBirthday({ name: name.trim(), relation: relation.trim() || undefined, calendarType, month, day, reminderOffsets: offsets }); onClose() }
  return <ComposerShell title="新增生日" onClose={onClose}><form className="sticky-form" onSubmit={submit}><label>姓名<input autoFocus onChange={(event) => setName(event.target.value)} placeholder="例如：妈妈" value={name} /></label><label>关系<input onChange={(event) => setRelation(event.target.value)} placeholder="可选" value={relation} /></label><div className="calendar-toggle"><button className={calendarType === 'gregorian' ? 'selected' : ''} onClick={() => setCalendarType('gregorian')} type="button">公历</button><button className={calendarType === 'lunar' ? 'selected' : ''} onClick={() => setCalendarType('lunar')} type="button">农历</button></div><div className="birthday-date-input"><label>月份<input max="12" min="1" onChange={(event) => setMonth(Math.min(12, Math.max(1, Number(event.target.value) || 1)))} type="number" value={month} /></label><label>日期<input max="31" min="1" onChange={(event) => setDay(Math.min(31, Math.max(1, Number(event.target.value) || 1)))} type="number" value={day} /></label></div><div className="birthday-offsets"><strong>提前提醒</strong>{[7, 5, 3, 0].map((value) => <button className={offsets.includes(value) ? 'selected' : ''} key={value} onClick={() => toggleOffset(value)} type="button">{value === 0 ? '当天' : `提前${value}天`}</button>)}</div><button className="primary-button full-width" type="submit">保存生日</button></form></ComposerShell>
}
