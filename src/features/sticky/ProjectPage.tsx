import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { FormEvent, PointerEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { createProject, createProjectNode, deleteProject, saveProject, setProjectStatus, toggleProjectNode } from '../../db/repositories'
import type { Project } from '../../domain/types'

const nodePresets = ['初尺', '量尺', '改图', '改方案', '二改', '三改', '出图', '复尺', '下单', 'PPT']

function ProjectPageLoading() { return <section className="page loading-page" aria-busy="true"><div className="loading-card" /><div className="loading-card" /><div className="loading-card short" /></section> }

export function ProjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const projectQuery = useLiveQuery(() => id && id !== 'new' ? db.projects.get(id) : undefined, [id])
  const nodesQuery = useLiveQuery(() => id && id !== 'new' ? db.projectNodes.where('projectId').equals(id).toArray() : [], [id])
  if (id && id !== 'new' && (projectQuery === undefined || nodesQuery === undefined)) return <ProjectPageLoading />
  return <ProjectFields existing={projectQuery} nodes={nodesQuery ?? []} onDone={() => navigate('/stickies')} />
}

function ProjectFields({ existing, nodes, onDone }: { existing?: Project; nodes: import('../../domain/types').ProjectNode[]; onDone: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState(existing?.name ?? '')
  const [client, setClient] = useState(existing?.client ?? '')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [nodeTitle, setNodeTitle] = useState('')
  const [startX, setStartX] = useState<number | null>(null)
  const orderedNodes = [...nodes].sort((a, b) => a.position - b.position)
  const completedCount = orderedNodes.filter((node) => node.status === 'completed').length

  async function saveProjectDetails(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    if (existing) await saveProject({ ...existing, name: name.trim(), client: client.trim() || undefined, address: address.trim() || undefined })
    else { const project = await createProject({ name, client, address }); navigate(`/stickies/projects/${project.id}`, { replace: true }) }
  }
  async function addNode(event: FormEvent) {
    event.preventDefault()
    if (!existing || !nodeTitle.trim()) return
    await createProjectNode(existing.id, nodeTitle)
    setNodeTitle('')
  }
  async function addPreset(title: string) {
    if (!existing || orderedNodes.some((node) => node.title === title)) return
    await createProjectNode(existing.id, title)
  }
  async function completeProject() { if (existing) await setProjectStatus(existing.id, existing.status === 'completed' ? 'active' : 'completed') }
  async function removeProject() { if (existing && window.confirm('删除项目会同时删除全部节点和时间线，确定继续吗？')) { await deleteProject(existing.id); onDone() } }
  function pointerDown(event: PointerEvent<HTMLElement>) { setStartX(event.clientX) }
  function pointerUp(event: PointerEvent<HTMLElement>) { if (startX !== null && event.clientX - startX > 70) void completeProject(); setStartX(null) }

  return <section className="page project-page"><header className="page-header project-header"><div><Link className="back-link" to={existing ? '/stickies/work' : '/stickies/new'}>← 返回{existing ? '工作项目' : '便利贴'}</Link><p className="eyebrow">{existing?.status === 'completed' ? '已完成项目' : '工作项目'}</p><h1>{existing ? '项目详情' : '新建项目'}</h1></div></header><form className="project-form" onSubmit={saveProjectDetails}><label>项目名称<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：某某客户装修" /></label><div className="project-two-fields"><label>客户<input value={client} onChange={(event) => setClient(event.target.value)} placeholder="可选" /></label><label>地址<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="可选" /></label></div><button className="primary-button full-width" disabled={!name.trim()} type="submit">{existing ? '保存项目信息' : '创建项目'}</button></form>{existing && <><section className="project-progress-card" onPointerDown={pointerDown} onPointerUp={pointerUp} style={{ '--project-color': existing.color } as React.CSSProperties}><div><strong>{existing.name}</strong><small>{existing.client || existing.address || '未填写客户信息'}</small></div><span>{completedCount}/{orderedNodes.length}</span></section><section className="project-node-section"><div className="section-heading"><h2>项目节点</h2><span>右滑项目可标记完成</span></div><form className="node-add-form" onSubmit={addNode}><input aria-label="新增节点" onChange={(event) => setNodeTitle(event.target.value)} placeholder="新增一个节点，例如：复尺" value={nodeTitle} /><button aria-label="添加节点" type="submit">＋</button></form><div className="node-presets">{nodePresets.map((preset) => <button className={orderedNodes.some((node) => node.title === preset) ? 'added' : ''} disabled={orderedNodes.some((node) => node.title === preset)} key={preset} onClick={() => void addPreset(preset)} type="button">{preset}</button>)}</div><div className="project-node-list">{orderedNodes.map((node) => <article className={`project-node${node.status === 'completed' ? ' completed' : ''}`} key={node.id} onClick={() => void toggleProjectNode(node.id)}><button aria-label={node.status === 'completed' ? `恢复 ${node.title}` : `完成 ${node.title}`} className="node-check" type="button">{node.status === 'completed' ? '✓' : '○'}</button><div><strong>{node.title}</strong><small>{node.status === 'completed' ? `完成于 ${node.completedAt ? new Date(node.completedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}` : '待完成'}</small></div></article>)}</div>{orderedNodes.length === 0 && <p className="project-empty">先从上方选择常用节点，也可以手动输入。</p>}</section><section className="project-timeline"><div className="section-heading"><h2>完成时间线</h2><span>{completedCount} 个节点</span></div><div className="project-timeline-list">{orderedNodes.filter((node) => node.status === 'completed').sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? '')).map((node) => <div className="project-event" key={node.id}><div className="project-event-time">{node.completedAt ? new Date(node.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '—'}</div><i /><div><strong>{node.title}</strong><small>{node.completedAt ? new Date(node.completedAt).toLocaleDateString('zh-CN') : ''} · 已完成</small></div></div>)}</div>{completedCount === 0 && <p className="project-empty">完成节点后会在这里留下记录。</p>}</section><div className="project-actions"><button className="primary-button full-width" onClick={() => void completeProject()} type="button">{existing.status === 'completed' ? '恢复到进行中' : '标记项目完成'}</button><button className="danger-button" onClick={() => void removeProject()} type="button">删除项目</button></div></>}</section>
}
