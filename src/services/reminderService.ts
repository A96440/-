export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.requestPermission()
}

export function notifyHabit(name: string, time: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(`该完成：${name}`, { body: `${time} 的习惯提醒`, tag: `xiaorizi-habit-${name}` })
}
