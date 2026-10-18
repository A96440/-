import { registerSW } from 'virtual:pwa-register'

export type AppUpdateCheck = 'ready' | 'current' | 'unsupported' | 'unavailable'

let currentRegistration: ServiceWorkerRegistration | undefined

export const updateServiceWorker = registerSW({
  immediate: true,
  onRegistered(registration) {
    currentRegistration = registration
  },
  onNeedRefresh() {
    window.dispatchEvent(new Event('xiaorizi-update-available'))
  },
  onNeedReload() {
    window.dispatchEvent(new Event('xiaorizi-update-available'))
  },
})

async function getRegistration() {
  if (currentRegistration) return currentRegistration
  if (!('serviceWorker' in navigator)) return undefined
  currentRegistration = await navigator.serviceWorker.getRegistration()
  return currentRegistration
}

function waitForControllerChange(timeoutMs: number) {
  return new Promise<void>((resolve) => {
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      window.clearTimeout(timeout)
      navigator.serviceWorker.removeEventListener('controllerchange', finish)
      resolve()
    }
    const timeout = window.setTimeout(finish, timeoutMs)
    navigator.serviceWorker.addEventListener('controllerchange', finish, { once: true })
  })
}

/**
 * Ask the active PWA registration to look for a new worker. The explicit
 * result lets the settings page explain what happened instead of silently
 * reloading an old Safari cache.
 */
export async function checkForAppUpdate(): Promise<AppUpdateCheck> {
  if (!('serviceWorker' in navigator)) return 'unsupported'
  const registration = await getRegistration()
  if (!registration) return 'unavailable'
  if (registration.waiting) return 'ready'

  const found = await new Promise<boolean>((resolve) => {
    let finished = false
    const finish = (hasUpdate: boolean) => {
      if (finished) return
      finished = true
      window.clearTimeout(timeout)
      navigator.serviceWorker.removeEventListener('controllerchange', controllerChanged)
      registration.removeEventListener('updatefound', updateFound)
      resolve(hasUpdate)
    }
    const controllerChanged = () => finish(true)
    const updateFound = () => {
      const worker = registration.installing
      if (!worker) return
      const stateChanged = () => {
        if (worker.state === 'installed' || worker.state === 'activated') finish(true)
      }
      worker.addEventListener('statechange', stateChanged)
      stateChanged()
    }
    const timeout = window.setTimeout(() => finish(Boolean(registration.waiting)), 2500)
    navigator.serviceWorker.addEventListener('controllerchange', controllerChanged, { once: true })
    registration.addEventListener('updatefound', updateFound, { once: true })
    void registration.update().catch(() => finish(false))
  })

  return found ? 'ready' : 'current'
}

/** Activate a worker that has already been found. The caller controls reload
 * so the UI can show "正在更新" and recover from a failed activation. */
export async function activateAvailableUpdate(): Promise<void> {
  const registration = await getRegistration()
  if (registration?.waiting) {
    const controllerChange = waitForControllerChange(2500)
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    await controllerChange
  }
  await updateServiceWorker(true)
}
