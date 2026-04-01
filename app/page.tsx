'use client'

import { useState, useEffect, useCallback } from 'react'
import Nav from '@/components/Nav'
import LeagueFilter from '@/components/LeagueFilter'
import MatchCard from '@/components/MatchCard'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'
import { LIVE_STATUSES, LEAGUES } from '@/lib/leagues'
import type { NormalizedMatch } from '@/lib/api-football'

const DEFAULT_LEAGUE = LEAGUES[0].id // Premier League

function sortMatches(matches: NormalizedMatch[]): NormalizedMatch[] {
  const order = (m: NormalizedMatch) =>
    LIVE_STATUSES.has(m.status) ? 0 : m.status === 'NS' ? 1 : 2
  return [...matches].sort((a, b) => order(a) - order(b))
}

export default function ScoresPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>(DEFAULT_LEAGUE)
  const [matches, setMatches] = useState<NormalizedMatch[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/scores?league=${selectedLeague}`)
      if (!res.ok) throw new Error()
      const data: NormalizedMatch[] = await res.json()
      setMatches(sortMatches(data))
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedLeague])

  useEffect(() => {
    setLoading(true)
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  const hasLive = matches.some((m) => LIVE_STATUSES.has(m.status))

  return (
    <>
      <Nav active="scores" hasLive={hasLive} />
      <LeagueFilter selected={selectedLeague} onChange={setSelectedLeague} />

      <main style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {error && <ErrorState />}
        {!error && !loading && matches.length === 0 && (
          <EmptyState message="No matches today for this league." />
        )}
        {matches.map((m) => <MatchCard key={m.id} match={m} />)}
      </main>

      <footer style={{ padding: '12px 24px', borderTop: '1px solid var(--border-divider)', textAlign: 'center' }}>
        <span style={{ color: '#333', fontSize: 10, letterSpacing: 1 }}>DATA: FOOTBALL-DATA.ORG · REFRESHES EVERY 60s</span>
      </footer>
    </>
  )
}
