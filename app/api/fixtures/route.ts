import { NextRequest, NextResponse } from 'next/server'
import { fetchFixtures, getCurrentSeason } from '@/lib/api-football'

export const revalidate = 900

export async function GET(request: NextRequest): Promise<NextResponse> {
  const leagueParam = request.nextUrl.searchParams.get('league')
  if (!leagueParam) {
    return NextResponse.json({ error: 'league param required' }, { status: 400 })
  }

  const today = new Date()
  const from = today.toISOString().slice(0, 10)
  const to = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  try {
    const fixtures = await fetchFixtures(Number(leagueParam), getCurrentSeason(), from, to)
    return NextResponse.json(fixtures)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
