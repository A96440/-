import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { HistoryPage } from './features/history/HistoryPage'
import { FocusPage } from './features/focus/FocusPage'
import { HabitFormPage } from './features/habits/HabitFormPage'
import { HabitsPage } from './features/habits/HabitsPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TodayPage } from './features/today/TodayPage'
import './App.css'

export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL}><Routes><Route element={<AppShell />}><Route index element={<Navigate to="/history" replace />} /><Route path="today" element={<TodayPage />} /><Route path="history" element={<HistoryPage />} /><Route path="focus" element={<FocusPage />} /><Route path="habits" element={<HabitsPage />} /><Route path="habits/new" element={<HabitFormPage />} /><Route path="habits/:id/edit" element={<HabitFormPage />} /><Route path="me" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/history" replace />} /></Route></Routes></BrowserRouter>
}
