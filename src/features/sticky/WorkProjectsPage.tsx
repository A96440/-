import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { setProjectStatus } from '../../db/repositories'
import { projectMeta } from '../../domain/sticky'
import type { Project, ProjectNode } from '../../domain/types'
import { UndoNoticeBar } from './UndoNoticeBar'
import { useUndoNotice } from './useUndoNotice'

export function WorkProjectsPage() {
  const projectsQuery = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray(), [])
  const nodesQuery = useLiveQuery(() => db.projectNodes.toArray(), [])
  const navigate = useNavigate()
  const undoNotice = useUndoNotice()
  if (!projectsQuery || !nodesQuery) return <section className="page loading-page" aria-busy="true"><div className="loading-card" /><div className="loading-card" /><div className="loading-card short" /></section>
  const active = projectsQuery.filter((project) => project.status === 'active')
  const completed = projectsQuery.filter((project) => project.status === 'completed')

  async function toggleProject(project: Project) {
    const next = project.status === 'completed' ? 'active' : 'completed'
    await setProjectStatus(project.id, next)
    undoNotice.show({ message: next === 'completed' ? `已完成：${project.name}` : `已恢复：${project.name}`, undo: () => setProjectStatus(project.id, project.status) })
  }

  return <section className="page work-projects-page"><header className="page-header"><div><Link className="back-link" to="/stickies">← 返回便利贴</Link><h1>工作项目</h1></div><Link aria-label="新建项目" className="icon-button" to="/stickies/projects/new">＋</Link></header><div className="work-project-list">{active.map((project) => <ProjectCard key={project.id} nodes={nodesQuery} onOpen={() => navigate(`/stickies/projects/${project.id}`)} onToggle={() => void toggleProject(project)} project={project} />)}{active.length === 0 && <div className="empty-state compact-empty"><h2>还没有工作项目</h2><Link className="primary-button" to="/stickies/projects/new">创建第一个项目</Link></div>}</div>{completed.length > 0 && <section className="work-completed"><div className="section-heading"><h2>已完成项目</h2><span>{completed.length} 个</span></div>{completed.map((project) => <ProjectCard key={project.id} nodes={nodesQuery} onOpen={() => navigate(`/stickies/projects/${project.id}`)} onToggle={() => void toggleProject(project)} project={project} />)}</section>}<UndoNoticeBar notice={undoNotice.notice} onDismiss={undoNotice.dismiss} /></section>
}

function ProjectCard({ project, nodes: allNodes, onOpen, onToggle }: { project: Project; nodes: ProjectNode[]; onOpen: () => void; onToggle: () => void }) {
  const nodes = allNodes.filter((node) => node.projectId === project.id).sort((a, b) => a.position - b.position)
  const completedNodes = nodes.filter((node) => node.status === 'completed')
  const next = nodes.find((node) => node.status === 'pending')
  const current = completedNodes.at(-1) ?? next
  return <article className={`work-project-card${project.status === 'completed' ? ' completed-project-card' : ''}`} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen() } }} role="link" tabIndex={0}><button aria-label={project.status === 'completed' ? `恢复 ${project.name}` : `完成 ${project.name}`} className="sticky-row-check" onClick={(event) => { event.stopPropagation(); onToggle() }} type="button">{project.status === 'completed' ? '✓' : ''}</button><div className="work-project-copy"><div className="work-project-title"><strong>{project.name}</strong><span>{project.status === 'completed' ? '已完成' : '进行中'}</span></div><small>{projectMeta(project)}</small><p>{current ? `${completedNodes.length ? '已完成' : '当前'}：${current.title}` : '还没有任务节点'}</p></div></article>
}
