import { fetchScores, fetchStandings, fetchFixtures, type NormalizedMatch } from '@/lib/api-football'

const RAW_MATCH = {
  id: 100,
  utcDate: '2026-03-31T20:00:00Z',
  status: 'IN_PLAY',
  matchday: 28,
  stage: 'REGULAR_SEASON',
  homeTeam: { id: 57, name: 'Arsenal' },
  awayTeam: { id: 61, name: 'Chelsea' },
  score: { fullTime: { home: 2, away: 1 } },
  competition: { code: 'PL' },
}

const RAW_UPCOMING = {
  id: 200,
  utcDate: '2026-04-01T19:00:00Z',
  status: 'TIMED',
  matchday: 29,
  stage: 'REGULAR_SEASON',
  homeTeam: { id: 81, name: 'FC Barcelona' },
  awayTeam: { id: 559, name: 'Sevilla FC' },
  score: { fullTime: { home: null, away: null } },
  competition: { code: 'PD' },
}

const RAW_STANDING = {
  position: 1,
  team: { id: 81, name: 'FC Barcelona' },
  playedGames: 28,
  won: 19,
  draw: 5,
  lost: 4,
  goalDifference: 38,
  points: 62,
}

describe('fetchScores', () => {
  beforeEach(() => {
    process.env.FOOTBALLDATA_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [RAW_MATCH] }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.FOOTBALLDATA_KEY
  })

  it('calls football-data.org matches endpoint with correct params', async () => {
    await fetchScores('PL', '2026-03-31')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/PL/matches?dateFrom=2026-03-31&dateTo=2026-03-31',
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Auth-Token': expect.any(String) }) })
    )
  })

  it('returns normalized matches with status mapped from IN_PLAY to 1H', async () => {
    const matches = await fetchScores('PL', '2026-03-31')
    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject<Partial<NormalizedMatch>>({
      id: 100,
      homeTeam: { id: 57, name: 'Arsenal' },
      awayTeam: { id: 61, name: 'Chelsea' },
      homeScore: 2,
      awayScore: 1,
      status: '1H',
      leagueId: 'PL',
      round: 'Matchday 28',
    })
  })

  it('maps TIMED status to NS', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [RAW_UPCOMING] }),
    })
    const matches = await fetchScores('PD', '2026-04-01')
    expect(matches[0].status).toBe('NS')
  })

  it('maps FINISHED status to FT', async () => {
    const finishedMatch = { ...RAW_MATCH, status: 'FINISHED' }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [finishedMatch] }),
    })
    const matches = await fetchScores('PL', '2026-03-31')
    expect(matches[0].status).toBe('FT')
  })

  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 })
    await expect(fetchScores('PL', '2026-03-31')).rejects.toThrow('football-data.org error: 429')
  })
})

describe('fetchStandings', () => {
  beforeEach(() => {
    process.env.FOOTBALLDATA_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        standings: [{ type: 'TOTAL', table: [RAW_STANDING] }]
      }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.FOOTBALLDATA_KEY
  })

  it('calls standings endpoint with competition code', async () => {
    await fetchStandings('PD')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/PD/standings',
      expect.anything()
    )
  })

  it('returns normalized standings from TOTAL table', async () => {
    const standings = await fetchStandings('PD')
    expect(standings).toHaveLength(1)
    expect(standings[0]).toMatchObject({
      rank: 1,
      teamId: 81,
      teamName: 'FC Barcelona',
      played: 28,
      wins: 19,
      draws: 5,
      losses: 4,
      goalDifference: 38,
      points: 62,
    })
  })

  it('picks TOTAL type when multiple types present', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        standings: [
          { type: 'HOME', table: [] },
          { type: 'TOTAL', table: [RAW_STANDING] },
          { type: 'AWAY', table: [] },
        ]
      }),
    })
    const standings = await fetchStandings('PD')
    expect(standings).toHaveLength(1)
  })
})

describe('fetchFixtures', () => {
  beforeEach(() => {
    process.env.FOOTBALLDATA_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [RAW_UPCOMING] }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.FOOTBALLDATA_KEY
  })

  it('calls matches endpoint with TIMED,SCHEDULED status and date range', async () => {
    await fetchFixtures('PD', '2026-03-31', '2026-04-07')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/PD/matches?status=TIMED,SCHEDULED&dateFrom=2026-03-31&dateTo=2026-04-07',
      expect.anything()
    )
  })

  it('returns normalized fixtures with YYYY-MM-DD date', async () => {
    const fixtures = await fetchFixtures('PD', '2026-03-31', '2026-04-07')
    expect(fixtures).toHaveLength(1)
    expect(fixtures[0]).toMatchObject({
      id: 200,
      date: '2026-04-01',
      homeTeam: { id: 81, name: 'FC Barcelona' },
      awayTeam: { id: 559, name: 'Sevilla FC' },
      leagueId: 'PD',
    })
    expect(fixtures[0].kickoff).toMatch(/^\d{2}:\d{2}$/)
  })
})
