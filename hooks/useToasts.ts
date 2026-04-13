'use client'

import { useState, useCallback } from 'react'
import type { NotificationEvent } from '@/lib/diff-matches'

export interface Toast {
  id: string
  event: NotificationEvent
  isFavorite: boolean
}

const MAX_TOASTS = 4

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((event: NotificationEvent, isFavorite: boolean) => {
    const id = `${event.matchId}-${event.type}-${Date.now()}`
    setToasts(prev => [{ id, event, isFavorite }, ...prev].slice(0, MAX_TOASTS))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, dismissToast }
}
