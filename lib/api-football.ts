const BASE_URL = 'https://api.football-data.org/v4'

function getHeaders(): HeadersInit {
  const key = process.env.FOOTBALLDATA_KEY
  if (!key) throw new Error('FOOTBALLDATA_KEY env var is not set')
  return { 'X-Auth-Token': key }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchStatus =
  | 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'P' | 'BT'
  | 'FT' | 'AET' | 'PEN' | 'SUSP' | 'INT' | 'PST' | 'CANC' | 'ABD'

export interface NormalizedMatch {
  id: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  minute: number | null
  stadium: string | null
  round: string | null
  leagueId: string   // competition code e.g. 'PL', 'PD'
  date: string
}

export interface NormalizedStanding {
  rank: number
  teamId: number
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  goalDifference: number
  points: number
}

export interface NormalizedFixture {
  id: number
  date: string    // YYYY-MM-DD
  kickoff: string // HH:MM UTC
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  leagueId: string  // competition code
}

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface RawFDMatch {
  id: number
  utcDate: string
  status: string
  matchday: number | null
  stage: string
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  score: { fullTime: { home: number | null; away: number | null } }
  competition: { code: string }
}

interface RawFDStanding {
  position: number
  team: { id: number; name: string }
  playedGames: number
  won: number
  draw: number
  lost: number
  goalDifference: number
  points: number
}

// ─── Status mapping ───────────────────────────────────────────────────────────

function mapStatus(fdStatus: string): MatchStatus {
  switch (fdStatus) {
    case 'TIMED':
    case 'SCHEDULED':  return 'NS'
    case 'IN_PLAY':    return '1H'
    case 'PAUSED':     return 'HT'
    case 'FINISHED':
    case 'AWARDED':    return 'FT'
    case 'POSTPONED':  return 'PST'
    case 'SUSPENDED':  return 'SUSP'
    case 'CANCELLED':  return 'CANC'
    default:           return 'NS'
  }
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeMatch(raw: RawFDMatch): NormalizedMatch {
  const round =
    raw.stage === 'REGULAR_SEASON' && raw.matchday != null
      ? `Matchday ${raw.matchday}`
      : raw.stage.replace(/_/g, ' ')

  return {
    id: raw.id,
    homeTeam: raw.homeTeam,
    awayTeam: raw.awayTeam,
    homeScore: raw.score.fullTime.home,
    awayScore: raw.score.fullTime.away,
    status: mapStatus(raw.status),
    minute: null,    // not available on free tier
    stadium: null,   // not available on free tier
    round,
    leagueId: raw.competition.code,
    date: raw.utcDate,
  }
}

function normalizeStanding(raw: RawFDStanding): NormalizedStanding {
  return {
    rank: raw.position,
    teamId: raw.team.id,
    teamName: raw.team.name,
    played: raw.playedGames,
    wins: raw.won,
    draws: raw.draw,
    losses: raw.lost,
    goalDifference: raw.goalDifference,
    points: raw.points,
  }
}

function normalizeFixture(raw: RawFDMatch): NormalizedFixture {
  const dt = new Date(raw.utcDate)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    id: raw.id,
    date: raw.utcDate.slice(0, 10),
    kickoff: `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`,
    homeTeam: raw.homeTeam,
    awayTeam: raw.awayTeam,
    leagueId: raw.competition.code,
  }
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

async function apiFetch(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)
  return res.json()
}

export async function fetchScores(
  competitionCode: string,
  date: string // YYYY-MM-DD
): Promise<NormalizedMatch[]> {
  const data = (await apiFetch(
    `/competitions/${competitionCode}/matches?dateFrom=${date}&dateTo=${date}`
  )) as { matches: RawFDMatch[] }
  return data.matches.map(normalizeMatch)
}

export async function fetchStandings(
  competitionCode: string
): Promise<NormalizedStanding[]> {
  const data = (await apiFetch(
    `/competitions/${competitionCode}/standings`
  )) as { standings: Array<{ type: string; table: RawFDStanding[] }> }
  const total = data.standings.find((s) => s.type === 'TOTAL')
  return (total?.table ?? []).map(normalizeStanding)
}

export async function fetchFixtures(
  competitionCode: string,
  from: string, // YYYY-MM-DD
  to: string    // YYYY-MM-DD
): Promise<NormalizedFixture[]> {
  const data = (await apiFetch(
    `/competitions/${competitionCode}/matches?status=TIMED,SCHEDULED&dateFrom=${from}&dateTo=${to}`
  )) as { matches: RawFDMatch[] }
  return data.matches.map(normalizeFixture)
}
