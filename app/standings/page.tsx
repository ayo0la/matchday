'use client'

import { useState, useEffect, useCallback } from 'react'
import Nav from '@/components/Nav'
import LeagueFilter from '@/components/LeagueFilter'
import StandingsTable from '@/components/StandingsTable'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'
import { LEAGUES } from '@/lib/leagues'
import type { NormalizedStanding } from '@/lib/api-football'

const DEFAULT_LEAGUE = LEAGUES[0].id

export default function StandingsPage() {
  const [selectedLeague, setSelectedLeague] = useState<number>(DEFAULT_LEAGUE)
  const [standings, setStandings] = useState<NormalizedStanding[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/standings?league=${selectedLeague}`)
      if (!res.ok) throw new Error()
      const data: NormalizedStanding[] = await res.json()
      setStandings(data)
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

  return (
    <>
      <Nav active="standings" />
      <LeagueFilter selected={selectedLeague} onChange={setSelectedLeague} />

      <main style={{ paddingTop: 20 }}>
        {error && <ErrorState />}
        {!error && !loading && standings.length === 0 && <EmptyState message="No standings available." />}
        {standings.length > 0 && (
          <StandingsTable standings={standings} leagueId={selectedLeague} />
        )}
      </main>
    </>
  )
}
