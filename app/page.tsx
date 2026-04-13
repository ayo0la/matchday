'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Nav from '@/components/Nav'
import LeagueFilter from '@/components/LeagueFilter'
import MatchCard from '@/components/MatchCard'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'
import ToastContainer from '@/components/ToastContainer'
import NotificationSettings from '@/components/NotificationSettings'
import { LIVE_STATUSES, LEAGUES } from '@/lib/leagues'
import { diffMatches, type NotificationEvent } from '@/lib/diff-matches'
import { useNotificationPrefs } from '@/hooks/useNotificationPrefs'
import { useToasts } from '@/hooks/useToasts'
import type { NormalizedMatch } from '@/lib/api-football'

const DEFAULT_LEAGUE = LEAGUES[0].id

function sortMatches(matches: NormalizedMatch[]): NormalizedMatch[] {
  const order = (m: NormalizedMatch) =>
    LIVE_STATUSES.has(m.status) ? 0 : m.status === 'NS' ? 1 : 2
  return [...matches].sort((a, b) => order(a) - order(b))
}

function fireOsNotification(event: NotificationEvent) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  const title =
    event.type === 'GOAL' && event.scoringTeam
      ? `GOAL — ${event.scoringTeam.name}`
      : `${event.homeTeam.name} vs ${event.awayTeam.name}`

  const score =
    event.homeScore !== null && event.awayScore !== null
      ? `${event.homeScore}–${event.awayScore}`
      : null

  const body = score
    ? `${event.homeTeam.name} ${score} ${event.awayTeam.name}`
    : `${event.homeTeam.name} vs ${event.awayTeam.name}`

  new Notification(title, { body, icon: '/favicon.ico' })
}

export default function ScoresPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>(DEFAULT_LEAGUE)
  const [matches, setMatches] = useState<NormalizedMatch[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const prevMatches = useRef<NormalizedMatch[]>([])
  const { prefs, toggleLeague, toggleFavoriteTeam } = useNotificationPrefs()
  const { toasts, addToast, dismissToast } = useToasts()

  const prefsRef = useRef(prefs)
  useEffect(() => { prefsRef.current = prefs }, [prefs])

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/scores?league=${selectedLeague}`)
      if (!res.ok) throw new Error()
      const data: NormalizedMatch[] = await res.json()
      const sorted = sortMatches(data)

      const events = diffMatches(prevMatches.current, data)
      for (const event of events) {
        if (prefsRef.current.mutedLeagues.includes(event.leagueId)) continue
        const isFavorite =
          prefsRef.current.favoriteTeams.includes(event.homeTeam.id) ||
          prefsRef.current.favoriteTeams.includes(event.awayTeam.id)
        addToast(event, isFavorite)
        fireOsNotification(event)
      }
      prevMatches.current = data

      setMatches(sorted)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedLeague, addToast])  // prefs removed — read via prefsRef instead

  useEffect(() => {
    setLoading(true)
    prevMatches.current = []
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  const hasLive = matches.some(m => LIVE_STATUSES.has(m.status))

  const availableTeams = useMemo(() => {
    const seen = new Map<number, string>()
    for (const m of matches) {
      seen.set(m.homeTeam.id, m.homeTeam.name)
      seen.set(m.awayTeam.id, m.awayTeam.name)
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [matches])

  return (
    <>
      <Nav active="scores" hasLive={hasLive} onBellClick={() => setShowSettings(true)} />
      <LeagueFilter selected={selectedLeague} onChange={setSelectedLeague} />

      <main style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {error && <ErrorState />}
        {!error && !loading && matches.length === 0 && (
          <EmptyState message="No matches today for this league." />
        )}
        {matches.map(m => <MatchCard key={m.id} match={m} />)}
      </main>

      <footer style={{ padding: '12px 24px', borderTop: '1px solid var(--border-divider)', textAlign: 'center' }}>
        <span style={{ color: '#333', fontSize: 10, letterSpacing: 1 }}>DATA: FOOTBALL-DATA.ORG · REFRESHES EVERY 60s</span>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showSettings && (
        <NotificationSettings
          prefs={prefs}
          onToggleLeague={toggleLeague}
          onToggleFavoriteTeam={toggleFavoriteTeam}
          availableTeams={availableTeams}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}
