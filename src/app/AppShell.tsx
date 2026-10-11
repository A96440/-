import { NavLink, Outlet } from 'react-router-dom'

const navItems = [{ to: '/', label: '今日', icon: '✓', end: true }, { to: '/history', label: '打卡表', icon: '▦' }, { to: '/habits', label: '习惯', icon: '☷' }, { to: '/me', label: '我的', icon: '○' }]

export function AppShell() {
  return <div className="app-shell"><main className="app-main"><Outlet /></main><nav className="bottom-nav" aria-label="主导航">{navItems.map((item) => <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end={item.end} key={item.to} to={item.to}><span aria-hidden="true" className="nav-icon">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav></div>
}
