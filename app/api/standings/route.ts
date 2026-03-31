import { NextRequest, NextResponse } from 'next/server'
import { fetchStandings, getCurrentSeason } from '@/lib/api-football'

export const revalidate = 300

export async function GET(request: NextRequest): Promise<NextResponse> {
  const leagueParam = request.nextUrl.searchParams.get('league')
  if (!leagueParam) {
    return NextResponse.json({ error: 'league param required' }, { status: 400 })
  }

  try {
    const standings = await fetchStandings(Number(leagueParam), getCurrentSeason())
    return NextResponse.json(standings)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
