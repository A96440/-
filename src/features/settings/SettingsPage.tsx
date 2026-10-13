import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { db } from '../../db/db'
import { setSetting } from '../../db/repositories'
import { downloadBackup, importBackup } from '../../services/dataTransfer'
import { requestNotificationPermission } from '../../services/reminderService'

const themes = [{ name: '柔和绿', value: '#6d9875' }, { name: '暖杏色', value: '#c78b62' }, { name: '雾霾蓝', value: '#6f8fa3' }]

export function SettingsPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const themeSetting = useLiveQuery(() => db.settings.get('theme'), [], undefined) as { value?: string } | undefined
  const [status, setStatus] = useState('')
  const theme = themeSetting?.value ?? themes[0].value
  const notificationPermission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', theme)
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
    document.documentElement.style.setProperty('--accent', value)
  }

  return <section className="page"><header className="page-header"><div><p className="eyebrow">只属于你的空间</p><h1>我的</h1></div></header><div className="settings-list"><button onClick={() => downloadBackup()} type="button"><span>⇩</span><span><strong>导出数据</strong><small>保存一份本地备份</small></span><b>›</b></button><button onClick={() => fileInput.current?.click()} type="button"><span>⇧</span><span><strong>导入恢复</strong><small>从备份文件恢复数据</small></span><b>›</b></button><input accept="application/json,.json" className="visually-hidden" onChange={handleImport} ref={fileInput} type="file" /><button onClick={enableNotifications} type="button"><span>◐</span><span><strong>通知权限</strong><small>{notificationPermission === 'granted' ? '已允许，习惯提醒可用' : notificationPermission === 'unsupported' ? '当前浏览器不支持' : '点击允许习惯提醒'}</small></span><b>›</b></button></div><div className="settings-section"><h2>主题颜色</h2><div className="theme-options">{themes.map((item) => <button className={theme === item.value ? 'theme-option selected' : 'theme-option'} key={item.value} onClick={() => selectTheme(item.value)} type="button"><span style={{ backgroundColor: item.value }} />{item.name}</button>)}</div></div>{status && <p className="settings-status" role="status">{status}</p>}</section>
}

