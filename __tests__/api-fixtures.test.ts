import { GET } from '@/app/api/fixtures/route'
import { NextRequest } from 'next/server'

const MOCK_UPCOMING = {
  id: 300,
  utcDate: '2026-04-01T19:00:00Z',
  status: 'TIMED',
  matchday: 29,
  stage: 'REGULAR_SEASON',
  homeTeam: { id: 81, name: 'FC Barcelona' },
  awayTeam: { id: 78, name: 'Atletico Madrid' },
  score: { fullTime: { home: null, away: null } },
  competition: { code: 'PD' },
}

describe('GET /api/fixtures', () => {
  beforeEach(() => {
    process.env.FOOTBALLDATA_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [MOCK_UPCOMING] }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.FOOTBALLDATA_KEY
  })

  it('returns 200 with normalized fixtures array', async () => {
    const req = new NextRequest('http://localhost/api/fixtures?league=PD')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data[0]).toMatchObject({ id: 300, homeTeam: { id: 81 }, date: '2026-04-01' })
  })

  it('returns 400 if league param is missing', async () => {
    const req = new NextRequest('http://localhost/api/fixtures')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
