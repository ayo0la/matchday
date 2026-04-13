import { diffMatches, type NotificationEvent } from '@/lib/diff-matches'
import type { NormalizedMatch } from '@/lib/api-football'

function makeMatch(overrides: Partial<NormalizedMatch> = {}): NormalizedMatch {
  return {
    id: 1,
    homeTeam: { id: 10, name: 'Arsenal' },
    awayTeam: { id: 20, name: 'Chelsea' },
    homeScore: 0,
    awayScore: 0,
    status: '1H',
    minute: null,
    stadium: null,
    round: 'Matchday 1',
    leagueId: 'PL',
    date: '2026-04-13T15:00:00Z',
    ...overrides,
  }
}

describe('diffMatches', () => {
  it('returns empty array when prev and next are identical', () => {
    const match = makeMatch()
    expect(diffMatches([match], [match])).toEqual([])
  })

  it('returns empty array when prev is empty', () => {
    const match = makeMatch()
    expect(diffMatches([], [match])).toEqual([])
  })

  it('returns empty array when next is empty', () => {
    const match = makeMatch()
    expect(diffMatches([match], [])).toEqual([])
  })

  it('detects GOAL when home score increases', () => {
    const prev = makeMatch({ homeScore: 0, awayScore: 0, status: '1H' })
    const next = makeMatch({ homeScore: 1, awayScore: 0, status: '1H' })
    const events = diffMatches([prev], [next])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('GOAL')
    expect(events[0].scoringTeam).toEqual({ id: 10, name: 'Arsenal' })
    expect(events[0].homeScore).toBe(1)
    expect(events[0].awayScore).toBe(0)
  })

  it('detects GOAL when away score increases', () => {
    const prev = makeMatch({ homeScore: 1, awayScore: 0, status: '1H' })
    const next = makeMatch({ homeScore: 1, awayScore: 1, status: '1H' })
    const events = diffMatches([prev], [next])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('GOAL')
    expect(events[0].scoringTeam).toEqual({ id: 20, name: 'Chelsea' })
  })

  it('emits GOAL (not STATUS_CHANGE) when score changes alongside status change', () => {
    const prev = makeMatch({ homeScore: 0, awayScore: 0, status: 'NS' })
    const next = makeMatch({ homeScore: 1, awayScore: 0, status: '1H' })
    const events = diffMatches([prev], [next])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('GOAL')
  })

  it('detects KICK_OFF when status moves from NS to 1H', () => {
    const prev = makeMatch({ status: 'NS' })
    const next = makeMatch({ status: '1H' })
    const events = diffMatches([prev], [next])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('KICK_OFF')
  })

  it('detects KICK_OFF when status moves from NS to ET', () => {
    const prev = makeMatch({ status: 'NS' })
    const next = makeMatch({ status: 'ET' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('KICK_OFF')
  })

  it('detects HALF_TIME when status becomes HT', () => {
    const prev = makeMatch({ status: '1H' })
    const next = makeMatch({ status: 'HT' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('HALF_TIME')
  })

  it('detects FULL_TIME when status becomes FT', () => {
    const prev = makeMatch({ status: '1H' })
    const next = makeMatch({ status: 'FT' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('FULL_TIME')
  })

  it('detects FULL_TIME when status becomes AET', () => {
    const prev = makeMatch({ status: 'ET' })
    const next = makeMatch({ status: 'AET' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('FULL_TIME')
  })

  it('detects FULL_TIME when status becomes PEN', () => {
    const prev = makeMatch({ status: 'ET' })
    const next = makeMatch({ status: 'PEN' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('FULL_TIME')
  })

  it('detects STATUS_CHANGE for SUSP', () => {
    const prev = makeMatch({ status: '1H' })
    const next = makeMatch({ status: 'SUSP' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('STATUS_CHANGE')
  })

  it('detects STATUS_CHANGE for PST', () => {
    const prev = makeMatch({ status: 'NS' })
    const next = makeMatch({ status: 'PST' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('STATUS_CHANGE')
  })

  it('detects STATUS_CHANGE for CANC', () => {
    const prev = makeMatch({ status: 'NS' })
    const next = makeMatch({ status: 'CANC' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('STATUS_CHANGE')
  })

  it('emits events for multiple matches', () => {
    const prev = [
      makeMatch({ id: 1, homeScore: 0, awayScore: 0, status: '1H' }),
      makeMatch({ id: 2, homeScore: 0, awayScore: 0, status: 'NS' }),
    ]
    const next = [
      makeMatch({ id: 1, homeScore: 1, awayScore: 0, status: '1H' }),
      makeMatch({ id: 2, homeScore: 0, awayScore: 0, status: '1H' }),
    ]
    const events = diffMatches(prev, next)
    expect(events).toHaveLength(2)
    expect(events.find(e => e.matchId === 1)?.type).toBe('GOAL')
    expect(events.find(e => e.matchId === 2)?.type).toBe('KICK_OFF')
  })

  it('includes leagueId on every event', () => {
    const prev = makeMatch({ status: 'NS', leagueId: 'PD' })
    const next = makeMatch({ status: '1H', leagueId: 'PD' })
    const events = diffMatches([prev], [next])
    expect(events[0].leagueId).toBe('PD')
  })
})
