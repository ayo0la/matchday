import { GET } from '@/app/api/scores/route'
import { NextRequest } from 'next/server'

const MOCK_MATCH = {
  fixture: {
    id: 1,
    date: '2026-03-31T20:00:00+00:00',
    status: { short: 'FT', elapsed: 90 },
    venue: { name: 'Old Trafford' },
  },
  league: { id: 39, round: 'GW 28' },
  teams: {
    home: { id: 33, name: 'Man United' },
    away: { id: 40, name: 'Liverpool' },
  },
  goals: { home: 0, away: 2 },
}

describe('GET /api/scores', () => {
  beforeEach(() => {
    process.env.APIFOOTBALL_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: [MOCK_MATCH] }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.APIFOOTBALL_KEY
  })

  it('returns 200 with normalized matches array', async () => {
    const req = new NextRequest('http://localhost/api/scores?league=39')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0]).toMatchObject({ id: 1, homeTeam: { id: 33 }, awayTeam: { id: 40 } })
  })

  it('returns 400 if league param is missing', async () => {
    const req = new NextRequest('http://localhost/api/scores')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
