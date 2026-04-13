import type { NormalizedMatch, MatchStatus } from '@/lib/api-football'
import { LIVE_STATUSES, FINISHED_STATUSES } from '@/lib/leagues'

export type EventType = 'GOAL' | 'KICK_OFF' | 'HALF_TIME' | 'FULL_TIME' | 'STATUS_CHANGE'

export interface NotificationEvent {
  type: EventType
  matchId: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  homeScore: number | null
  awayScore: number | null
  scoringTeam?: { id: number; name: string }
  newStatus: MatchStatus
  leagueId: string
}

export function getEventLabel(type: EventType): string {
  switch (type) {
    case 'GOAL':
      return 'GOAL'
    case 'KICK_OFF':
      return 'KICK OFF'
    case 'HALF_TIME':
      return 'HALF TIME'
    case 'FULL_TIME':
      return 'FULL TIME'
    case 'STATUS_CHANGE':
      return 'UPDATE'
  }
}

export function diffMatches(
  prev: NormalizedMatch[],
  next: NormalizedMatch[]
): NotificationEvent[] {
  const prevMap = new Map(prev.map(m => [m.id, m]))
  const events: NotificationEvent[] = []

  for (const match of next) {
    const old = prevMap.get(match.id)
    if (!old) continue

    const base = {
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      newStatus: match.status,
      leagueId: match.leagueId,
    }

    const homeGoal = (match.homeScore ?? 0) > (old.homeScore ?? 0)
    const awayGoal = (match.awayScore ?? 0) > (old.awayScore ?? 0)

    if (homeGoal || awayGoal) {
      events.push({
        type: 'GOAL',
        ...base,
        scoringTeam: homeGoal ? match.homeTeam : match.awayTeam,
      })
      continue
    }

    if (old.status === match.status) continue

    if (!LIVE_STATUSES.has(old.status) && LIVE_STATUSES.has(match.status)) {
      events.push({ type: 'KICK_OFF', ...base })
    } else if (match.status === 'HT') {
      events.push({ type: 'HALF_TIME', ...base })
    } else if (FINISHED_STATUSES.has(match.status)) {
      events.push({ type: 'FULL_TIME', ...base })
    } else {
      events.push({ type: 'STATUS_CHANGE', ...base })
    }
  }

  return events
}
