import { GET } from '@/app/api/scores/route'
import { NextRequest } from 'next/server'

const MOCK_MATCH = {
  id: 1,
  utcDate: '2026-03-31T20:00:00Z',
  status: 'FINISHED',
  matchday: 28,
  stage: 'REGULAR_SEASON',
  homeTeam: { id: 66, name: 'Man United' },
  awayTeam: { id: 64, name: 'Liverpool' },
  score: { fullTime: { home: 0, away: 2 } },
  competition: { code: 'PL' },
}

describe('GET /api/scores', () => {
  beforeEach(() => {
    process.env.FOOTBALLDATA_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [MOCK_MATCH] }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.FOOTBALLDATA_KEY
  })

  it('returns 200 with normalized matches array', async () => {
    const req = new NextRequest('http://localhost/api/scores?league=PL')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0]).toMatchObject({ id: 1, homeTeam: { id: 66 }, awayTeam: { id: 64 } })
  })

  it('returns 400 if league param is missing', async () => {
    const req = new NextRequest('http://localhost/api/scores')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
