import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import type { Project, ProjectNode } from '../../domain/types'

export function WorkProjectsPage() {
  const projectsQuery = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray(), [])
  const nodesQuery = useLiveQuery(() => db.projectNodes.toArray(), [])
  if (!projectsQuery || !nodesQuery) return <section className="page loading-page" aria-busy="true"><div className="loading-card" /><div className="loading-card" /><div className="loading-card short" /></section>
  const projects = projectsQuery
  const allNodes = nodesQuery
  const active = projects.filter((project) => project.status === 'active')
  const completed = projects.filter((project) => project.status === 'completed')
  function ProjectCard({ project }: { project: Project }) {
    const nodes: ProjectNode[] = allNodes.filter((node) => node.projectId === project.id)
    const done = nodes.filter((node) => node.status === 'completed').length
    const next = nodes.filter((node) => node.status === 'pending').sort((a, b) => a.position - b.position)[0]
    return <Link className={`work-project-card${project.status === 'completed' ? ' completed-project-card' : ''}`} to={`/stickies/projects/${project.id}`}><div><strong>{project.name}</strong></div><span className="work-progress">{done}/{nodes.length}</span><p>{next ? `下一步：${next.title}` : nodes.length ? '全部节点已完成' : '还没有任务节点'}</p></Link>
  }
  return <section className="page work-projects-page"><header className="page-header"><div><Link className="back-link" to="/stickies">← 返回便利贴</Link><h1>工作项目</h1></div><Link aria-label="新建项目" className="icon-button" to="/stickies/projects/new">＋</Link></header><div className="work-project-list">{active.map((project) => <ProjectCard key={project.id} project={project} />)}{active.length === 0 && <div className="empty-state compact-empty"><h2>还没有工作项目</h2><Link className="primary-button" to="/stickies/projects/new">创建第一个项目</Link></div>}</div>{completed.length > 0 && <section className="work-completed"><div className="section-heading"><h2>已完成项目</h2><span>{completed.length} 个</span></div>{completed.map((project) => <ProjectCard key={project.id} project={project} />)}</section>}</section>
}
