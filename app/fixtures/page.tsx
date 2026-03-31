'use client'

import { useState, useEffect, useCallback } from 'react'
import Nav from '@/components/Nav'
import LeagueFilter from '@/components/LeagueFilter'
import FixtureCard from '@/components/FixtureCard'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'
import { LEAGUES, BARCA_ID } from '@/lib/leagues'
import type { NormalizedFixture } from '@/lib/api-football'

const ALL = 0

function getDateLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  if (dateStr === today) return 'TODAY'
  if (dateStr === tomorrow) return 'TOMORROW'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  }).toUpperCase()
}

function groupAndSort(fixtures: NormalizedFixture[]): [string, NormalizedFixture[]][] {
  const map: Record<string, NormalizedFixture[]> = {}
  for (const f of fixtures) {
    if (!map[f.date]) map[f.date] = []
    map[f.date].push(f)
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => {
      const aBarca = a.homeTeam.id === BARCA_ID || a.awayTeam.id === BARCA_ID ? -1 : 0
      const bBarca = b.homeTeam.id === BARCA_ID || b.awayTeam.id === BARCA_ID ? -1 : 0
      return aBarca - bBarca
    })
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
}

export default function FixturesPage() {
  const [selectedLeague, setSelectedLeague] = useState(ALL)
  const [fixtures, setFixtures] = useState<NormalizedFixture[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const leagueIds = selectedLeague === ALL
      ? LEAGUES.map((l) => l.id)
      : [selectedLeague]

    try {
      const results = await Promise.all(
        leagueIds.map((id) => fetch(`/api/fixtures?league=${id}`).then((r) => r.json()))
      )
      const all: NormalizedFixture[] = results.flat()
      setFixtures(all)
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

  const groups = groupAndSort(fixtures)
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <>
      <Nav active="fixtures" />
      <LeagueFilter selected={selectedLeague} onChange={setSelectedLeague} includeAll />

      <main style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {error && <ErrorState />}
        {!error && !loading && fixtures.length === 0 && (
          <EmptyState message="No upcoming fixtures in the next 7 days." />
        )}

        {groups.map(([date, dayFixtures]) => (
          <div key={date}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                color: date === todayStr ? 'var(--red)' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2
              }}>
                {getDateLabel(date)}
              </span>
              <span style={{ color: '#333', fontSize: 11 }}>
                {new Date(date).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayFixtures.map((f) => <FixtureCard key={f.id} fixture={f} />)}
            </div>
          </div>
        ))}
      </main>
    </>
  )
}
