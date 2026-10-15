import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { HistoryPage } from './features/history/HistoryPage'
import { HabitFormPage } from './features/habits/HabitFormPage'
import { HabitsPage } from './features/habits/HabitsPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TodayPage } from './features/today/TodayPage'
import { updateServiceWorker } from './pwa'
import './App.css'

export default function App() {
  const [updateReady, setUpdateReady] = useState(false)
  const [updating, setUpdating] = useState(false)
  async function applyUpdate() {
    if (updating) return
    setUpdating(true)
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.update()))
      }
      await Promise.race([updateServiceWorker(true), new Promise((resolve) => window.setTimeout(resolve, 1500))])
    } catch {
      // Reload below still lets the browser activate a newly downloaded worker.
    }
    window.location.reload()
  }
  useEffect(() => {
    const handleUpdate = () => setUpdateReady(true)
    window.addEventListener('xiaorizi-update-available', handleUpdate)
    return () => window.removeEventListener('xiaorizi-update-available', handleUpdate)
  }, [])
  return <><BrowserRouter basename={import.meta.env.BASE_URL}><Routes><Route element={<AppShell />}><Route index element={<Navigate to="/today" replace />} /><Route path="today" element={<TodayPage />} /><Route path="history" element={<HistoryPage />} /><Route path="habits" element={<HabitsPage />} /><Route path="habits/new" element={<HabitFormPage />} /><Route path="habits/:id/edit" element={<HabitFormPage />} /><Route path="me" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/today" replace />} /></Route></Routes></BrowserRouter>{updateReady && <div className="update-banner" role="status"><span>{updating ? '正在更新…' : '发现新版本'}</span><button aria-busy={updating} disabled={updating} onClick={() => void applyUpdate()} type="button">{updating ? '请稍候' : '立即更新'}</button></div>}</>
}
