import { GET } from '@/app/api/fixtures/route'
import { NextRequest } from 'next/server'

const MOCK_UPCOMING = {
  fixture: {
    id: 300,
    date: '2026-04-01T19:00:00+00:00',
    status: { short: 'NS', elapsed: null },
    venue: { name: 'Camp Nou' },
  },
  league: { id: 140, round: 'GW 29' },
  teams: {
    home: { id: 529, name: 'Barcelona' },
    away: { id: 530, name: 'Atletico' },
  },
  goals: { home: null, away: null },
}

describe('GET /api/fixtures', () => {
  beforeEach(() => {
    process.env.APIFOOTBALL_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: [MOCK_UPCOMING] }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.APIFOOTBALL_KEY
  })

  it('returns 200 with normalized fixtures array', async () => {
    const req = new NextRequest('http://localhost/api/fixtures?league=140')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data[0]).toMatchObject({ id: 300, homeTeam: { id: 529 }, date: '2026-04-01' })
  })

  it('returns 400 if league param is missing', async () => {
    const req = new NextRequest('http://localhost/api/fixtures')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
