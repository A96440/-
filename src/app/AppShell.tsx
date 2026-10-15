import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { db } from '../db/db'

const navItems = [{ to: '/today', label: '今日', icon: 'today' }, { to: '/habits', label: '习惯', icon: 'habits' }, { to: '/history', label: '打卡表', icon: 'history' }, { to: '/stickies', label: '便利贴', icon: 'sticky' }, { to: '/me', label: '我的', icon: 'profile' }] as const
const themeTones: Record<string, { soft: string; ink: string }> = { '#6d9875': { soft: '#e9f1e8', ink: '#45634d' }, '#c78b62': { soft: '#faede4', ink: '#8b5b40' }, '#6f8fa3': { soft: '#e7eff4', ink: '#4c6e82' } }

function NavIcon({ name }: { name: (typeof navItems)[number]['icon'] }) {
  if (name === 'today') return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="m8.3 12 2.3 2.3 5.2-5.2" /></svg>
  if (name === 'habits') return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
  if (name === 'history') return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="16" rx="2" /><path d="M7.5 4.5v-2M16.5 4.5v-2M3.5 9h17M7 17v-3M12 17v-5M17 17v-8" /></svg>
  if (name === 'sticky') return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4.5h14v11l-4.5 4H5z" /><path d="M14.5 19.5v-4h4M8 8h8M8 11.5h6" /></svg>
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="3.2" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>
}

export function AppShell() {
  const themeSetting = useLiveQuery(() => db.settings.get('theme'), [], undefined) as { value?: string } | undefined
  useEffect(() => {
    const accent = themeSetting?.value ?? '#6d9875'
    const tone = themeTones[accent] ?? themeTones['#6d9875']
    document.documentElement.style.setProperty('--accent', accent)
    document.documentElement.style.setProperty('--accent-soft', tone.soft)
    document.documentElement.style.setProperty('--accent-ink', tone.ink)
  }, [themeSetting?.value])

  return <div className="app-shell"><main className="app-main"><Outlet /></main><nav className="bottom-nav" aria-label="主导航">{navItems.map((item) => <NavLink aria-label={item.label} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end key={item.to} to={item.to}><span className="nav-icon"><NavIcon name={item.icon} /></span><span className="nav-label">{item.label}</span></NavLink>)}</nav></div>
}
