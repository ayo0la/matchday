'use client'

import { useState, useCallback, useRef } from 'react'
import type { NotificationEvent } from '@/lib/diff-matches'

export interface Toast {
  id: string
  event: NotificationEvent
  isFavorite: boolean
}

const MAX_TOASTS = 4

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const addToast = useCallback((event: NotificationEvent, isFavorite: boolean) => {
    const id = `${event.matchId}-${event.type}-${Date.now()}`
    setToasts(prev => [{ id, event, isFavorite }, ...prev].slice(0, MAX_TOASTS))
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      timers.current.delete(id)
    }, 5000)
    timers.current.set(id, timer)
  }, [])

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, dismissToast }
}
