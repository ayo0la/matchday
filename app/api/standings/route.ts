import { NextRequest, NextResponse } from 'next/server'
import { fetchStandings } from '@/lib/api-football'

export const revalidate = 300

export async function GET(request: NextRequest): Promise<NextResponse> {
  const league = request.nextUrl.searchParams.get('league')
  if (!league) {
    return NextResponse.json({ error: 'league param required' }, { status: 400 })
  }

  try {
    const standings = await fetchStandings(league)
    return NextResponse.json(standings)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
