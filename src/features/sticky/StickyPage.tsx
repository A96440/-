import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { createBirthday, createLifeItem, createMemo, deleteBirthday, deleteLifeItem, deleteMemo, saveBirthday, saveLifeItem, saveMemo, setProjectStatus, toggleLifeItem } from '../../db/repositories'
import { daysUntil, lunarDayLabel, lunarMonthLabel, nextBirthdayDate, projectMeta } from '../../domain/sticky'
import type { Birthday, CalendarType, LifeItem, Memo, Project } from '../../domain/types'
import { UndoNoticeBar } from './UndoNoticeBar'
import { useUndoNotice } from './useUndoNotice'

type Composer = 'life' | 'memo' | 'birthday' | null

function formatDate(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(value))
}

export function StickyPage() {
  const projectsQuery = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray(), [])
  const lifeQuery = useLiveQuery(() => db.lifeItems.orderBy('updatedAt').reverse().toArray(), [])
  const memosQuery = useLiveQuery(() => db.memos.orderBy('updatedAt').reverse().toArray(), [])
  const birthdaysQuery = useLiveQuery(() => db.birthdays.orderBy('month').toArray(), [])
  const [composer, setComposer] = useState<Composer>(null)
  const [editingMemo, setEditingMemo] = useState<Memo | undefined>()
  const [editingLife, setEditingLife] = useState<LifeItem | undefined>()
  const [editingBirthday, setEditingBirthday] = useState<Birthday | undefined>()
  const navigate = useNavigate()
  const undoNotice = useUndoNotice()
  const loading = [projectsQuery, lifeQuery, memosQuery, birthdaysQuery].some((value) => value === undefined)
  const projects = projectsQuery ?? []
  const lifeItems = lifeQuery ?? []
  const memos = memosQuery ?? []
  const birthdays = birthdaysQuery ?? []
  const activeProjects = projects.filter((project) => project.status === 'active')
  const completedProjects = projects.filter((project) => project.status === 'completed')
  const activeLife = lifeItems.filter((item) => item.status === 'active')
  const completedLife = lifeItems.filter((item) => item.status === 'completed')
  const activeMemos = memos.filter((memo) => memo.status === 'active')
  const upcomingBirthdays = birthdays.map((birthday) => ({ birthday, date: nextBirthdayDate(birthday) })).sort((a, b) => a.date.getTime() - b.date.getTime())

  async function changeProjectStatus(project: Project) {
    const nextStatus = project.status === 'completed' ? 'active' : 'completed'
    await setProjectStatus(project.id, nextStatus)
    undoNotice.show({ message: nextStatus === 'completed' ? `已完成：${project.name}` : `已恢复：${project.name}`, undo: () => setProjectStatus(project.id, project.status) })
  }

  async function changeLifeStatus(item: LifeItem) {
    const nextStatus = item.status === 'completed' ? 'active' : 'completed'
    await toggleLifeItem(item.id)
    undoNotice.show({ message: nextStatus === 'completed' ? `已完成：${item.title}` : `已恢复：${item.title}`, undo: () => toggleLifeItem(item.id) })
  }

  if (loading) return <section className="page sticky-page loading-page" aria-busy="true"><header className="page-header"><div><p className="eyebrow">正在整理</p><h1>便利贴</h1></div></header><div className="sticky-quadrants"><div className="loading-card" /><div className="loading-card" /><div className="loading-card" /><div className="loading-card" /></div></section>

  const closeComposer = () => { setComposer(null); setEditingMemo(undefined); setEditingLife(undefined); setEditingBirthday(undefined) }

  return <section className="page sticky-page"><header className="page-header sticky-header"><div><p className="eyebrow">把事情放在合适的位置</p><h1>便利贴</h1></div><Link aria-label="新建便利贴" className="icon-button" to="/stickies/new">＋</Link></header><div className="sticky-quadrants">
    <section className="sticky-quadrant work-quadrant" onClick={() => navigate('/stickies/work')}><QuadrantHeader addTo="/stickies/projects/new" title="工作项目" to="/stickies/work" /><div className="sticky-preview-list">{[...activeProjects.slice(0, 3), ...completedProjects.slice(0, 1)].map((project) => <ProjectPreview key={project.id} project={project} onComplete={() => void changeProjectStatus(project)} />)}</div>{activeProjects.length === 0 && completedProjects.length === 0 && <EmptyQuadrant text="还没有工作项目" />}</section>
    <section className="sticky-quadrant life-quadrant" onClick={() => navigate('/stickies/life')}><QuadrantHeader addTo="/stickies/new?kind=life" title="生活" to="/stickies/life" /><div className="sticky-preview-list">{[...activeLife.slice(0, 3), ...completedLife.slice(0, 1)].map((item) => <LifePreview key={item.id} item={item} onComplete={() => void changeLifeStatus(item)} onEdit={() => { setEditingLife(item); setComposer('life') }} />)}</div>{activeLife.length === 0 && completedLife.length === 0 && <EmptyQuadrant text="还没有生活事项" />}</section>
    <section className="sticky-quadrant memo-quadrant" onClick={() => navigate('/stickies/memos')}><QuadrantHeader addTo="/stickies/new?kind=memo" title="灵感速记" to="/stickies/memos" /><div className="sticky-preview-list">{activeMemos.slice(0, 3).map((memo) => <button className="sticky-preview memo-preview" key={memo.id} onClick={(event) => { event.stopPropagation(); setEditingMemo(memo); setComposer('memo') }} type="button"><span>{memo.content || '暂无内容'}</span></button>)}</div>{activeMemos.length === 0 && <EmptyQuadrant text="记录突然想到的事情" />}</section>
    <section className="sticky-quadrant birthday-quadrant" onClick={() => navigate('/stickies/birthdays')}><QuadrantHeader addTo="/stickies/new?kind=birthday" title="生日" to="/stickies/birthdays" /><div className="sticky-preview-list">{upcomingBirthdays.slice(0, 3).map(({ birthday, date }) => <button className="sticky-preview birthday-preview" key={birthday.id} onClick={(event) => { event.stopPropagation(); setEditingBirthday(birthday); setComposer('birthday') }} type="button"><strong>{birthday.name}</strong><span>{birthday.calendarType === 'lunar' ? `农历${lunarMonthLabel(birthday.month)}${lunarDayLabel(birthday.day)}` : `公历${birthday.month}月${birthday.day}日`}</span><small>还有 {daysUntil(date)} 天</small></button>)}</div>{upcomingBirthdays.length === 0 && <EmptyQuadrant text="添加一个重要的生日" />}</section>
  </div>{(completedProjects.length > 0 || completedLife.length > 0) && <section className="sticky-completed-section"><div className="sticky-section-heading"><h2>已完成</h2><span>{completedProjects.length + completedLife.length} 项</span></div>{completedProjects.map((project) => <Link className="completed-sticky-row" key={project.id} to={`/stickies/projects/${project.id}`}><span>✓</span><strong>{project.name}</strong><small>项目已完成</small></Link>)}{completedLife.map((item) => <div className="completed-sticky-row" key={item.id}><button aria-label={`恢复 ${item.title}`} onClick={() => void changeLifeStatus(item)} type="button">✓</button><strong>{item.title}</strong><small>生活事项</small><button aria-label={`删除 ${item.title}`} onClick={() => { if (window.confirm('确定删除这项生活事项吗？')) void deleteLifeItem(item.id) }} type="button">×</button></div>)}</section>}{composer === 'life' && <LifeComposer onClose={closeComposer} item={editingLife} />}{composer === 'memo' && <MemoComposer onClose={closeComposer} memo={editingMemo} />}{composer === 'birthday' && <BirthdayComposer onClose={closeComposer} birthday={editingBirthday} />}{<UndoNoticeBar notice={undoNotice.notice} onDismiss={undoNotice.dismiss} />}</section>
}

function QuadrantHeader({ title, to, addTo }: { title: string; to?: string; addTo: string }) {
  const heading = <h2>{title}</h2>
  return <div className="quadrant-heading"><Link className="quadrant-title-link" to={to ?? '#'} onClick={(event) => event.stopPropagation()}>{heading}</Link><Link aria-label={`新增${title}`} className="quadrant-add" onClick={(event) => event.stopPropagation()} to={addTo}>＋</Link></div>
}
function EmptyQuadrant({ text }: { text: string }) { return <p className="quadrant-empty">{text}</p> }

function ProjectPreview({ project, onComplete }: { project: Project; onComplete: () => void }) {
  const navigate = useNavigate(); const startX = useRef<number | null>(null); const swiped = useRef(false)
  return <article aria-label={`${project.name}，点击查看工作项目，向右滑动完成`} className={`sticky-preview project-preview${project.status === 'completed' ? ' completed-preview' : ''}`} onClick={(event) => { event.stopPropagation(); if (swiped.current) { swiped.current = false; return } navigate(`/stickies/projects/${project.id}`) }} onPointerDown={(event) => { startX.current = event.clientX; event.currentTarget.setPointerCapture?.(event.pointerId) }} onPointerUp={(event) => { if (startX.current !== null && event.clientX - startX.current > 60) { swiped.current = true; onComplete() } startX.current = null }} onPointerCancel={() => { startX.current = null }} role="link" tabIndex={0}><button aria-label={project.status === 'completed' ? `恢复 ${project.name}` : `完成 ${project.name}`} className="sticky-row-check" onClick={(event) => { event.stopPropagation(); onComplete() }} type="button">{project.status === 'completed' ? '✓' : ''}</button><div className="sticky-row-copy"><strong>{project.name}</strong><span>{projectMeta(project)}</span></div></article>
}

function LifePreview({ item, onComplete, onEdit }: { item: LifeItem; onComplete: () => void; onEdit: () => void }) {
  const startX = useRef<number | null>(null); const swiped = useRef(false)
  return <article aria-label={`${item.title}，点击编辑，向右滑动完成`} className={`sticky-preview life-preview${item.status === 'completed' ? ' completed-preview' : ''}`} onClick={(event) => { event.stopPropagation(); if (swiped.current) { swiped.current = false; return } onEdit() }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onEdit() } }} onPointerDown={(event) => { startX.current = event.clientX; event.currentTarget.setPointerCapture?.(event.pointerId) }} onPointerUp={(event) => { if (startX.current !== null && event.clientX - startX.current > 60) { swiped.current = true; onComplete() } startX.current = null }} onPointerCancel={() => { startX.current = null }} role="button" tabIndex={0}><button aria-label={item.status === 'completed' ? `恢复 ${item.title}` : `完成 ${item.title}`} className="sticky-row-check" onClick={(event) => { event.stopPropagation(); onComplete() }} type="button">{item.status === 'completed' ? '✓' : ''}</button><div className="sticky-row-copy"><strong>{item.title}</strong>{item.dueAt && <small>{formatDate(item.dueAt)}</small>}</div></article>
}

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
  const [content, setContent] = useState(memo?.content ?? '')
  function generatedTitle(value: string) { const compact = value.replace(/\s+/g, ' ').trim(); return compact ? `${compact.slice(0, 18)}${compact.length > 18 ? '…' : ''}` : '未命名速记' }
  async function submit(event: FormEvent) { event.preventDefault(); if (!content.trim()) return; const title = generatedTitle(content); if (memo) await saveMemo({ ...memo, title, content: content.trim() }); else await createMemo(title, content.trim(), '#fbf8ef'); onClose() }
  async function remove() { if (memo && window.confirm('确定删除这条速记吗？')) { await deleteMemo(memo.id); onClose() } }
  return <ComposerShell title={memo ? '编辑速记' : '新增灵感速记'} onClose={onClose}><form className="sticky-form" onSubmit={submit}><label>直接记录<textarea autoFocus onChange={(event) => setContent(event.target.value)} placeholder="想到什么就写什么，不需要标题" value={content} /></label><p className="sticky-form-hint">保存后会自动取开头内容作为简短标题。</p><button className="primary-button full-width" disabled={!content.trim()} type="submit">保存</button>{memo && <button className="danger-button" onClick={() => void remove()} type="button">删除速记</button>}</form></ComposerShell>
}

export function BirthdayComposer({ onClose, birthday }: { onClose: () => void; birthday?: Birthday }) {
  const [name, setName] = useState(birthday?.name ?? ''); const [relation, setRelation] = useState(birthday?.relation ?? ''); const [calendarType, setCalendarType] = useState<CalendarType>(birthday?.calendarType ?? 'gregorian'); const [month, setMonth] = useState(birthday?.month ?? 1); const [day, setDay] = useState(birthday?.day ?? 1); const [offsets, setOffsets] = useState(birthday?.reminderOffsets ?? [7, 3, 0])
  function toggleOffset(value: number) { setOffsets((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value].sort((a, b) => b - a)) }
  async function submit(event: FormEvent) { event.preventDefault(); if (!name.trim()) return; const value = { name: name.trim(), relation: relation.trim() || undefined, calendarType, month, day, reminderOffsets: offsets }; if (birthday) await saveBirthday({ ...birthday, ...value }); else await createBirthday(value); onClose() }
  async function remove() { if (birthday && window.confirm('确定删除这个生日吗？')) { await deleteBirthday(birthday.id); onClose() } }
  return <ComposerShell title={birthday ? '编辑生日' : '新增生日'} onClose={onClose}><form className="sticky-form" onSubmit={submit}><label>姓名<input autoFocus onChange={(event) => setName(event.target.value)} placeholder="例如：妈妈" value={name} /></label><label>关系<input onChange={(event) => setRelation(event.target.value)} placeholder="可选" value={relation} /></label><div className="calendar-toggle"><button className={calendarType === 'gregorian' ? 'selected' : ''} onClick={() => setCalendarType('gregorian')} type="button">公历</button><button className={calendarType === 'lunar' ? 'selected' : ''} onClick={() => setCalendarType('lunar')} type="button">农历</button></div><div className="birthday-date-input"><label>月份<input max="12" min="1" onChange={(event) => setMonth(Math.min(12, Math.max(1, Number(event.target.value) || 1)))} type="number" value={month} /></label><label>日期<input max="31" min="1" onChange={(event) => setDay(Math.min(31, Math.max(1, Number(event.target.value) || 1)))} type="number" value={day} /></label></div><div className="birthday-offsets"><strong>提前提醒</strong>{[7, 5, 3, 0].map((value) => <button className={offsets.includes(value) ? 'selected' : ''} key={value} onClick={() => toggleOffset(value)} type="button">{value === 0 ? '当天' : `提前${value}天`}</button>)}</div><button className="primary-button full-width" type="submit">保存生日</button>{birthday && <button className="danger-button" onClick={() => void remove()} type="button">删除生日</button>}</form></ComposerShell>
}
