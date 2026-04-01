import { NextRequest, NextResponse } from 'next/server'
import { fetchScores } from '@/lib/api-football'

export const revalidate = 60

export async function GET(request: NextRequest): Promise<NextResponse> {
  const league = request.nextUrl.searchParams.get('league')
  if (!league) {
    return NextResponse.json({ error: 'league param required' }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)

  try {
    const matches = await fetchScores(league, today)
    return NextResponse.json(matches)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
