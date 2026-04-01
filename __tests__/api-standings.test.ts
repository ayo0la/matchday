import { GET } from '@/app/api/standings/route'
import { NextRequest } from 'next/server'

const MOCK_STANDING = {
  position: 1,
  team: { id: 81, name: 'FC Barcelona' },
  playedGames: 28,
  won: 19,
  draw: 5,
  lost: 4,
  goalDifference: 38,
  points: 62,
}

describe('GET /api/standings', () => {
  beforeEach(() => {
    process.env.FOOTBALLDATA_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        standings: [{ type: 'TOTAL', table: [MOCK_STANDING] }]
      }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.FOOTBALLDATA_KEY
  })

  it('returns 200 with normalized standings array', async () => {
    const req = new NextRequest('http://localhost/api/standings?league=PD')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data[0]).toMatchObject({ rank: 1, teamId: 81, points: 62 })
  })

  it('returns 400 if league param is missing', async () => {
    const req = new NextRequest('http://localhost/api/standings')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
