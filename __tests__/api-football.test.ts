import { fetchScores, fetchStandings, fetchFixtures, getCurrentSeason, type NormalizedMatch } from '@/lib/api-football'

const RAW_FIXTURE = {
  fixture: {
    id: 100,
    date: '2026-03-31T20:00:00+00:00',
    status: { short: '1H', elapsed: 34 },
    venue: { name: 'Emirates Stadium' },
  },
  league: { id: 39, round: 'Regular Season - 28' },
  teams: {
    home: { id: 42, name: 'Arsenal' },
    away: { id: 49, name: 'Chelsea' },
  },
  goals: { home: 2, away: 1 },
}

const RAW_UPCOMING = {
  fixture: {
    id: 200,
    date: '2026-04-01T19:00:00+00:00',
    status: { short: 'NS', elapsed: null },
    venue: { name: 'Camp Nou' },
  },
  league: { id: 140, round: 'Regular Season - 29' },
  teams: {
    home: { id: 529, name: 'Barcelona' },
    away: { id: 536, name: 'Sevilla' },
  },
  goals: { home: null, away: null },
}

const RAW_STANDING = {
  rank: 1,
  team: { id: 529, name: 'Barcelona' },
  all: { played: 28, win: 19, draw: 5, lose: 4 },
  goalsDiff: 38,
  points: 62,
}

describe('getCurrentSeason', () => {
  it('returns previous year when month is before July', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-31'))
    expect(getCurrentSeason()).toBe(2025)
    jest.useRealTimers()
  })

  it('returns current year when month is July or later', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-08-01'))
    expect(getCurrentSeason()).toBe(2026)
    jest.useRealTimers()
  })
})

describe('fetchScores', () => {
  beforeEach(() => {
    process.env.APIFOOTBALL_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: [RAW_FIXTURE] }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.APIFOOTBALL_KEY
  })

  it('calls API-Football fixtures endpoint with correct params', async () => {
    await fetchScores(39, 2025, '2026-03-31')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://v3.football.api-sports.io/fixtures?league=39&season=2025&date=2026-03-31',
      expect.objectContaining({ headers: expect.objectContaining({ 'x-apisports-key': expect.any(String) }) })
    )
  })

  it('returns normalized matches', async () => {
    const matches = await fetchScores(39, 2025, '2026-03-31')
    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject<Partial<NormalizedMatch>>({
      id: 100,
      homeTeam: { id: 42, name: 'Arsenal' },
      awayTeam: { id: 49, name: 'Chelsea' },
      homeScore: 2,
      awayScore: 1,
      status: '1H',
      minute: 34,
      stadium: 'Emirates Stadium',
      round: 'Regular Season - 28',
      leagueId: 39,
    })
  })

  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 })
    await expect(fetchScores(39, 2025, '2026-03-31')).rejects.toThrow('API-Football error: 429')
  })
})

describe('fetchStandings', () => {
  beforeEach(() => {
    process.env.APIFOOTBALL_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        response: [{ league: { standings: [[RAW_STANDING]] } }]
      }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.APIFOOTBALL_KEY
  })

  it('calls standings endpoint with correct params', async () => {
    await fetchStandings(140, 2025)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://v3.football.api-sports.io/standings?league=140&season=2025',
      expect.anything()
    )
  })

  it('returns normalized standings', async () => {
    const standings = await fetchStandings(140, 2025)
    expect(standings).toHaveLength(1)
    expect(standings[0]).toMatchObject({
      rank: 1,
      teamId: 529,
      teamName: 'Barcelona',
      played: 28,
      wins: 19,
      draws: 5,
      losses: 4,
      goalDifference: 38,
      points: 62,
    })
  })
})

describe('fetchFixtures', () => {
  beforeEach(() => {
    process.env.APIFOOTBALL_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: [RAW_UPCOMING] }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.APIFOOTBALL_KEY
  })

  it('calls fixtures endpoint with from/to/status params', async () => {
    await fetchFixtures(140, 2025, '2026-03-31', '2026-04-07')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://v3.football.api-sports.io/fixtures?league=140&season=2025&from=2026-03-31&to=2026-04-07&status=NS',
      expect.anything()
    )
  })

  it('returns normalized fixtures with YYYY-MM-DD date', async () => {
    const fixtures = await fetchFixtures(140, 2025, '2026-03-31', '2026-04-07')
    expect(fixtures).toHaveLength(1)
    expect(fixtures[0]).toMatchObject({
      id: 200,
      date: '2026-04-01',
      homeTeam: { id: 529, name: 'Barcelona' },
      awayTeam: { id: 536, name: 'Sevilla' },
      leagueId: 140,
    })
    expect(fixtures[0].kickoff).toMatch(/^\d{2}:\d{2}$/)
  })
})
