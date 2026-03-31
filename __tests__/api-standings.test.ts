import { GET } from '@/app/api/standings/route'
import { NextRequest } from 'next/server'

const MOCK_STANDING = {
  rank: 1,
  team: { id: 529, name: 'Barcelona' },
  all: { played: 28, win: 19, draw: 5, lose: 4 },
  goalsDiff: 38,
  points: 62,
}

describe('GET /api/standings', () => {
  beforeEach(() => {
    process.env.APIFOOTBALL_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        response: [{ league: { standings: [[MOCK_STANDING]] } }]
      }),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.APIFOOTBALL_KEY
  })

  it('returns 200 with normalized standings array', async () => {
    const req = new NextRequest('http://localhost/api/standings?league=140')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data[0]).toMatchObject({ rank: 1, teamId: 529, points: 62 })
  })

  it('returns 400 if league param is missing', async () => {
    const req = new NextRequest('http://localhost/api/standings')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
