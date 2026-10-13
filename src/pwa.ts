import { registerSW } from 'virtual:pwa-register'

export const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event('xiaorizi-update-available'))
  },
  onNeedReload() {
    window.dispatchEvent(new Event('xiaorizi-update-available'))
  },
})
