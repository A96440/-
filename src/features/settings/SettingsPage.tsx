import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { db } from '../../db/db'
import { setSetting } from '../../db/repositories'
import { downloadBackup, importBackup } from '../../services/dataTransfer'
import { requestNotificationPermission } from '../../services/reminderService'
import { activateAvailableUpdate, checkForAppUpdate } from '../../pwa'
import { APP_VERSION } from '../../app/version'

const themes = [{ name: '柔和绿', value: '#6d9875', soft: '#e9f1e8', ink: '#45634d' }, { name: '暖杏色', value: '#c78b62', soft: '#faede4', ink: '#8b5b40' }, { name: '雾霾蓝', value: '#6f8fa3', soft: '#e7eff4', ink: '#4c6e82' }]
type VersionState = 'idle' | 'checking' | 'ready' | 'updating' | 'current' | 'unavailable' | 'unsupported' | 'error'

function applyTheme(value: string) {
  const theme = themes.find((item) => item.value === value) ?? themes[0]
  document.documentElement.style.setProperty('--accent', theme.value)
  document.documentElement.style.setProperty('--accent-soft', theme.soft)
  document.documentElement.style.setProperty('--accent-ink', theme.ink)
}

export function SettingsPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const themeSetting = useLiveQuery(() => db.settings.get('theme'), [], undefined) as { value?: string } | undefined
  const [status, setStatus] = useState('')
  const [versionState, setVersionState] = useState<VersionState>('idle')
  const [versionMessage, setVersionMessage] = useState(`当前版本 v${APP_VERSION} · 点击检查更新`)
  const theme = themeSetting?.value ?? themes[0].value
  const notificationPermission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try { await importBackup(file); setStatus('数据已恢复') } catch (error) { setStatus(error instanceof Error ? error.message : '导入失败') }
    event.target.value = ''
  }

  async function enableNotifications() {
    if (notificationPermission === 'granted') { setStatus('通知权限已开启'); return }
    const permission = await requestNotificationPermission()
    if (permission === 'granted') setStatus('通知权限已开启')
    else if (permission === 'unsupported') setStatus('当前浏览器不支持通知')
    else setStatus('请允许通知权限后再试')
  }

  async function selectTheme(value: string) {
    await setSetting('theme', value)
    applyTheme(value)
  }

  useEffect(() => {
    const onUpdateAvailable = () => {
      setVersionState('ready')
      setVersionMessage('发现新版本 · 点击立即更新')
    }
    window.addEventListener('xiaorizi-update-available', onUpdateAvailable)
    return () => window.removeEventListener('xiaorizi-update-available', onUpdateAvailable)
  }, [])

  async function checkVersion() {
    if (versionState === 'checking' || versionState === 'updating') return
    if (versionState === 'ready') {
      setVersionState('updating')
      setVersionMessage('正在更新，请稍候…')
      try {
        await activateAvailableUpdate()
        window.location.reload()
      } catch {
        setVersionState('error')
        setVersionMessage('更新失败，请稍后重试')
      }
      return
    }
    setVersionState('checking')
    setVersionMessage('正在检查版本…')
    try {
      const result = await checkForAppUpdate()
      if (result === 'ready') {
        setVersionState('ready')
        setVersionMessage('发现新版本 · 点击立即更新')
      } else if (result === 'current') {
        setVersionState('current')
        setVersionMessage(`当前已是最新版本 v${APP_VERSION} · 刚刚检查`)
      } else if (result === 'unsupported') {
        setVersionState('unsupported')
        setVersionMessage('当前浏览器不支持 PWA 更新')
      } else {
        setVersionState('unavailable')
        setVersionMessage('当前页面未注册更新服务，请重新打开主屏幕应用')
      }
    } catch {
      setVersionState('error')
      setVersionMessage('检查失败，请稍后重试')
    }
  }

  const versionAction = versionState === 'ready' ? '立即更新' : versionState === 'checking' ? '检查中…' : versionState === 'updating' ? '更新中…' : '检查更新'

  return <section className="page"><header className="page-header"><div><p className="eyebrow">只属于你的空间</p><h1>我的</h1></div></header><div className="settings-list"><button onClick={() => downloadBackup()} type="button"><span>⇩</span><span><strong>导出数据</strong><small>保存一份本地备份</small></span><b>›</b></button><button onClick={() => fileInput.current?.click()} type="button"><span>⇧</span><span><strong>导入恢复</strong><small>从备份文件恢复数据</small></span><b>›</b></button><input accept="application/json,.json" className="visually-hidden" onChange={handleImport} ref={fileInput} type="file" /><button onClick={enableNotifications} type="button"><span>◐</span><span><strong>通知权限</strong><small>{notificationPermission === 'granted' ? '已允许，习惯提醒可用' : notificationPermission === 'unsupported' ? '当前浏览器不支持' : '点击允许习惯提醒'}</small></span><b>›</b></button><button className="version-setting" disabled={versionState === 'checking' || versionState === 'updating'} onClick={() => void checkVersion()} type="button"><span>↻</span><span><strong>版本更新</strong><small>{versionMessage}</small></span><b>{versionAction}</b></button></div><div className="settings-section"><h2>主题颜色</h2><div className="theme-options">{themes.map((item) => <button className={theme === item.value ? 'theme-option selected' : 'theme-option'} key={item.value} onClick={() => selectTheme(item.value)} type="button"><span style={{ backgroundColor: item.value }} />{item.name}</button>)}</div></div>{status && <p className="settings-status" role="status">{status}</p>}</section>
}

