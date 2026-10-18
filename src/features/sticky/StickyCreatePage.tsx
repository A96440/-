import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { BirthdayComposer, LifeComposer, MemoComposer } from './StickyPage'

export function StickyCreatePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const kind = params.get('kind')
  if (kind === 'life') return <LifeComposer onClose={() => navigate('/stickies')} />
  if (kind === 'memo') return <MemoComposer onClose={() => navigate('/stickies')} />
  if (kind === 'birthday') return <BirthdayComposer onClose={() => navigate('/stickies')} />
  return <section className="page sticky-create-page"><header className="page-header"><div><Link className="back-link" to="/stickies">‹ 返回便利贴</Link><p className="eyebrow">选择要记录的内容</p><h1>新建便利贴</h1></div></header><div className="create-choice-grid"><Link className="create-choice work-choice" to="/stickies/work"><strong>工作项目</strong><small>进入项目工作台，再添加任务节点</small></Link><Link className="create-choice life-choice" to="/stickies/new?kind=life"><strong>生活事项</strong><small>记录一件要完成的生活小事</small></Link><Link className="create-choice memo-choice" to="/stickies/new?kind=memo"><strong>灵感速记</strong><small>保存突然想到的内容和数据</small></Link><Link className="create-choice birthday-choice" to="/stickies/new?kind=birthday"><strong>生日提醒</strong><small>记录公历或农历生日</small></Link></div></section>
}
