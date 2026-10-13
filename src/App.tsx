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
  async function applyUpdate() {
    await updateServiceWorker(true)
    window.location.reload()
  }
  useEffect(() => {
    const handleUpdate = () => setUpdateReady(true)
    window.addEventListener('xiaorizi-update-available', handleUpdate)
    return () => window.removeEventListener('xiaorizi-update-available', handleUpdate)
  }, [])
  return <><BrowserRouter basename={import.meta.env.BASE_URL}><Routes><Route element={<AppShell />}><Route index element={<Navigate to="/history" replace />} /><Route path="today" element={<TodayPage />} /><Route path="history" element={<HistoryPage />} /><Route path="habits" element={<HabitsPage />} /><Route path="habits/new" element={<HabitFormPage />} /><Route path="habits/:id/edit" element={<HabitFormPage />} /><Route path="me" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/history" replace />} /></Route></Routes></BrowserRouter>{updateReady && <div className="update-banner" role="status"><span>发现新版本</span><button onClick={() => void applyUpdate()} type="button">立即更新</button></div>}</>
}
