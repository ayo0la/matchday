import { NextRequest, NextResponse } from 'next/server'
import { fetchScores, getCurrentSeason } from '@/lib/api-football'

export const revalidate = 60

export async function GET(request: NextRequest): Promise<NextResponse> {
  const leagueParam = request.nextUrl.searchParams.get('league')
  if (!leagueParam) {
    return NextResponse.json({ error: 'league param required' }, { status: 400 })
  }

  const leagueId = Number(leagueParam)
  const season = getCurrentSeason()
  const today = new Date().toISOString().slice(0, 10)

  try {
    const matches = await fetchScores(leagueId, season, today)
    return NextResponse.json(matches)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
