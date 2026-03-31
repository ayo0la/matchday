const BASE_URL = 'https://v3.football.api-sports.io'

function getHeaders(): HeadersInit {
  const key = process.env.APIFOOTBALL_KEY
  if (!key) throw new Error('APIFOOTBALL_KEY env var is not set')
  return { 'x-apisports-key': key }
}

export function getCurrentSeason(): number {
  const now = new Date()
  const month = now.getMonth() + 1 // 1–12
  const year = now.getFullYear()
  return month >= 7 ? year : year - 1
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
  leagueId: number
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
  kickoff: string // HH:MM (local time of kickoff)
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  leagueId: number
}

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface RawFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
    venue: { name: string | null }
  }
  league: { id: number; round: string }
  teams: { home: { id: number; name: string }; away: { id: number; name: string } }
  goals: { home: number | null; away: number | null }
}

interface RawStanding {
  rank: number
  team: { id: number; name: string }
  all: { played: number; win: number; draw: number; lose: number }
  goalsDiff: number
  points: number
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeMatch(raw: RawFixture): NormalizedMatch {
  return {
    id: raw.fixture.id,
    homeTeam: raw.teams.home,
    awayTeam: raw.teams.away,
    homeScore: raw.goals.home,
    awayScore: raw.goals.away,
    status: raw.fixture.status.short as MatchStatus,
    minute: raw.fixture.status.elapsed,
    stadium: raw.fixture.venue.name,
    round: raw.league.round,
    leagueId: raw.league.id,
    date: raw.fixture.date,
  }
}

function normalizeStanding(raw: RawStanding): NormalizedStanding {
  return {
    rank: raw.rank,
    teamId: raw.team.id,
    teamName: raw.team.name,
    played: raw.all.played,
    wins: raw.all.win,
    draws: raw.all.draw,
    losses: raw.all.lose,
    goalDifference: raw.goalsDiff,
    points: raw.points,
  }
}

function normalizeFixture(raw: RawFixture): NormalizedFixture {
  const dt = new Date(raw.fixture.date)
  const pad = (n: number) => String(n).padStart(2, '0')
  const kickoff = `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`
  return {
    id: raw.fixture.id,
    date: raw.fixture.date.slice(0, 10), // YYYY-MM-DD
    kickoff,
    homeTeam: raw.teams.home,
    awayTeam: raw.teams.away,
    leagueId: raw.league.id,
  }
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

async function apiFetch(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
  return res.json()
}

export async function fetchScores(
  leagueId: number,
  season: number,
  date: string // YYYY-MM-DD
): Promise<NormalizedMatch[]> {
  const data = (await apiFetch(
    `/fixtures?league=${leagueId}&season=${season}&date=${date}`
  )) as { response: RawFixture[] }
  return data.response.map(normalizeMatch)
}

export async function fetchStandings(
  leagueId: number,
  season: number
): Promise<NormalizedStanding[]> {
  const data = (await apiFetch(
    `/standings?league=${leagueId}&season=${season}`
  )) as { response: Array<{ league: { standings: RawStanding[][] } }> }
  const rows = data.response[0]?.league.standings[0] ?? []
  return rows.map(normalizeStanding)
}

export async function fetchFixtures(
  leagueId: number,
  season: number,
  from: string, // YYYY-MM-DD
  to: string    // YYYY-MM-DD
): Promise<NormalizedFixture[]> {
  const data = (await apiFetch(
    `/fixtures?league=${leagueId}&season=${season}&from=${from}&to=${to}&status=NS`
  )) as { response: RawFixture[] }
  return data.response.map(normalizeFixture)
}
