import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { HistoryPage } from './features/history/HistoryPage'
import { HabitFormPage } from './features/habits/HabitFormPage'
import { HabitsPage } from './features/habits/HabitsPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TodayPage } from './features/today/TodayPage'

export default function App() {
  return <BrowserRouter><Routes><Route element={<AppShell />}><Route index element={<TodayPage />} /><Route path="history" element={<HistoryPage />} /><Route path="habits" element={<HabitsPage />} /><Route path="habits/new" element={<HabitFormPage />} /><Route path="habits/:id/edit" element={<HabitFormPage />} /><Route path="me" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></BrowserRouter>
}
