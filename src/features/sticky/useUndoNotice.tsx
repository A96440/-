import { useEffect, useRef, useState } from 'react'

export type UndoNotice = {
  message: string
  undo: () => void | Promise<void>
}

export function useUndoNotice() {
  const [notice, setNotice] = useState<UndoNotice | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])

  function show(next: UndoNotice) {
    if (timer.current) window.clearTimeout(timer.current)
    setNotice(next)
    timer.current = window.setTimeout(() => setNotice(null), 4500)
  }

  function dismiss() {
    if (timer.current) window.clearTimeout(timer.current)
    setNotice(null)
  }

  return { notice, show, dismiss }
}

