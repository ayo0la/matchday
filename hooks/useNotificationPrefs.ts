'use client'

import { useState, useCallback } from 'react'
import { getPrefs, setPrefs, type NotificationPrefs } from '@/lib/notification-prefs'

export function useNotificationPrefs() {
  const [prefs, setPrefsState] = useState<NotificationPrefs>(getPrefs)

  const toggleLeague = useCallback((leagueId: string) => {
    setPrefsState(prev => {
      const muted = prev.mutedLeagues.includes(leagueId)
        ? prev.mutedLeagues.filter(id => id !== leagueId)
        : [...prev.mutedLeagues, leagueId]
      const next = { ...prev, mutedLeagues: muted }
      setPrefs(next)
      return next
    })
  }, [])

  const toggleFavoriteTeam = useCallback((teamId: number) => {
    setPrefsState(prev => {
      const favoriteTeams = prev.favoriteTeams.includes(teamId)
        ? prev.favoriteTeams.filter(id => id !== teamId)
        : [...prev.favoriteTeams, teamId]
      const next = { ...prev, favoriteTeams }
      setPrefs(next)
      return next
    })
  }, [])

  return { prefs, toggleLeague, toggleFavoriteTeam }
}
