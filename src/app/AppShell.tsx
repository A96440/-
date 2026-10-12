import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { db } from '../db/db'

const navItems = [{ to: '/today', label: '今日', icon: '✓' }, { to: '/habits', label: '习惯', icon: '▦' }, { to: '/focus', label: '专注', icon: '🍅' }, { to: '/history', label: '打卡表', icon: '▥' }, { to: '/me', label: '我的', icon: '○' }]

export function AppShell() {
  const themeSetting = useLiveQuery(() => db.settings.get('theme'), [], undefined) as { value?: string } | undefined
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', themeSetting?.value ?? '#6d9875')
  }, [themeSetting?.value])

  return <div className="app-shell"><main className="app-main"><Outlet /></main><nav className="bottom-nav" aria-label="主导航">{navItems.map((item) => <NavLink aria-label={item.label} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end key={item.to} to={item.to}><span aria-hidden="true" className="nav-icon">{item.icon}</span><span className="nav-label">{item.label}</span></NavLink>)}</nav></div>
}
