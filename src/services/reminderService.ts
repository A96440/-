export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.requestPermission()
}

export function notifyPending(count: number): void {
  if (count < 1 || !('Notification' in window) || Notification.permission !== 'granted') return
  new Notification('小日常提醒', { body: `今天还有 ${count} 个习惯没有完成`, tag: 'xiaorizi-pending' })
}
