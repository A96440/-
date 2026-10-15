import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { toggleLifeItem } from '../../db/repositories'
import { daysUntil, lunarDayLabel, lunarMonthLabel, nextBirthdayDate } from '../../domain/sticky'
import type { Birthday, LifeItem, Memo } from '../../domain/types'
import { BirthdayComposer, LifeComposer, MemoComposer } from './StickyPage'
import { UndoNoticeBar } from './UndoNoticeBar'
import { useUndoNotice } from './useUndoNotice'

export type StickyCollectionKind = 'life' | 'memos' | 'birthdays'

export function StickyCollectionPage({ kind }: { kind: StickyCollectionKind }) {
  const lifeQuery = useLiveQuery(() => db.lifeItems.orderBy('updatedAt').reverse().toArray(), [])
  const memoQuery = useLiveQuery(() => db.memos.orderBy('updatedAt').reverse().toArray(), [])
  const birthdayQuery = useLiveQuery(() => db.birthdays.orderBy('month').toArray(), [])
  const [editingLife, setEditingLife] = useState<LifeItem>()
  const [editingMemo, setEditingMemo] = useState<Memo>()
  const [editingBirthday, setEditingBirthday] = useState<Birthday>()
  const undoNotice = useUndoNotice()
  const loading = [lifeQuery, memoQuery, birthdayQuery].some((value) => value === undefined)
  if (loading) return <section className="page loading-page" aria-busy="true"><div className="loading-card" /><div className="loading-card" /><div className="loading-card short" /></section>

  const title = kind === 'life' ? '生活事项' : kind === 'memos' ? '灵感速记' : '生日提醒'
  const addTo = `/stickies/new?kind=${kind === 'memos' ? 'memo' : kind === 'birthdays' ? 'birthday' : 'life'}`
  const lifeItems = lifeQuery ?? []
  const memos = (memoQuery ?? []).filter((memo) => memo.status === 'active')
  const birthdays = (birthdayQuery ?? []).map((birthday) => ({ birthday, date: nextBirthdayDate(birthday) })).sort((a, b) => a.date.getTime() - b.date.getTime())
  const activeLife = lifeItems.filter((item) => item.status === 'active')
  const completedLife = lifeItems.filter((item) => item.status === 'completed')

  async function toggleLife(item: LifeItem) {
    const next = item.status === 'completed' ? 'active' : 'completed'
    await toggleLifeItem(item.id)
    undoNotice.show({ message: next === 'completed' ? `已完成：${item.title}` : `已恢复：${item.title}`, undo: () => toggleLifeItem(item.id) })
  }

  function closeComposer() {
    setEditingLife(undefined)
    setEditingMemo(undefined)
    setEditingBirthday(undefined)
  }

  return <section className="page sticky-collection-page"><header className="page-header"><div><Link className="back-link" to="/stickies">← 返回便利贴</Link><h1>{title}</h1></div><Link aria-label={`新增${title}`} className="icon-button" to={addTo}>＋</Link></header>{kind === 'life' && <><CollectionList>{activeLife.map((item) => <LifeRow item={item} key={item.id} onEdit={() => setEditingLife(item)} onToggle={() => void toggleLife(item)} />)}{activeLife.length === 0 && <CollectionEmpty text="还没有生活事项" />}</CollectionList>{completedLife.length > 0 && <section className="collection-completed"><div className="section-heading"><h2>已完成</h2><span>{completedLife.length} 项</span></div>{completedLife.map((item) => <LifeRow item={item} key={item.id} onEdit={() => setEditingLife(item)} onToggle={() => void toggleLife(item)} />)}</section>}</>}{kind === 'memos' && <CollectionList>{memos.map((memo) => <button className="collection-row memo-collection-row" key={memo.id} onClick={() => setEditingMemo(memo)} type="button"><div className="collection-row-copy"><strong>{memo.content || '暂无内容'}</strong><small>记录于 {new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(memo.updatedAt))}</small></div></button>)}{memos.length === 0 && <CollectionEmpty text="还没有灵感速记" />}</CollectionList>}{kind === 'birthdays' && <CollectionList>{birthdays.map(({ birthday, date }) => <button className="collection-row birthday-collection-row" key={birthday.id} onClick={() => setEditingBirthday(birthday)} type="button"><div className="collection-row-copy"><strong>{birthday.name}</strong><small>{birthday.calendarType === 'lunar' ? `农历${lunarMonthLabel(birthday.month)}${lunarDayLabel(birthday.day)}` : `公历${birthday.month}月${birthday.day}日`}</small></div><span>还有 {daysUntil(date)} 天</span></button>)}{birthdays.length === 0 && <CollectionEmpty text="还没有生日提醒" />}</CollectionList>}{editingLife && <LifeComposer item={editingLife} onClose={closeComposer} />}{editingMemo && <MemoComposer memo={editingMemo} onClose={closeComposer} />}{editingBirthday && <BirthdayComposer birthday={editingBirthday} onClose={closeComposer} />}<UndoNoticeBar notice={undoNotice.notice} onDismiss={undoNotice.dismiss} /></section>
}

function CollectionList({ children }: { children: React.ReactNode }) { return <div className="collection-list">{children}</div> }
function CollectionEmpty({ text }: { text: string }) { return <div className="collection-empty">{text}</div> }

function LifeRow({ item, onEdit, onToggle }: { item: LifeItem; onEdit: () => void; onToggle: () => void }) {
  return <article className={`collection-row life-collection-row${item.status === 'completed' ? ' completed-row' : ''}`} onClick={onEdit}><button aria-label={item.status === 'completed' ? `恢复 ${item.title}` : `完成 ${item.title}`} className="sticky-row-check" onClick={(event) => { event.stopPropagation(); onToggle() }} type="button">{item.status === 'completed' ? '✓' : ''}</button><div className="collection-row-copy"><strong>{item.title}</strong>{item.dueAt && <small>{new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(item.dueAt))}</small>}</div></article>
}
