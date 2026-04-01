export const BARCA_ID = 81 // football-data.org ID for FC Barcelona

export const LEAGUES = [
  { id: 'PL',  name: 'Premier League' },
  { id: 'PD',  name: 'La Liga' },
  { id: 'BL1', name: 'Bundesliga' },
  { id: 'SA',  name: 'Serie A' },
  { id: 'FL1', name: 'Ligue 1' },
  { id: 'CL',  name: 'Champions League' },
] as const

export type LeagueId = typeof LEAGUES[number]['id']

// Zone ranges per league (ranks are 1-indexed, inclusive)
export const STANDINGS_ZONES: Record<string, {
  ucl: number[]
  europa: number[]
  relegation: number[]
}> = {
  PL:  { ucl: [1,2,3,4],   europa: [5,6],   relegation: [18,19,20] },
  PD:  { ucl: [1,2,3,4],   europa: [5,6,7], relegation: [18,19,20] },
  BL1: { ucl: [1,2,3,4],   europa: [5,6],   relegation: [17,18]    },
  SA:  { ucl: [1,2,3,4],   europa: [5,6,7], relegation: [18,19,20] },
  FL1: { ucl: [1,2,3],     europa: [4,5,6], relegation: [17,18]    },
  CL:  { ucl: [],          europa: [],      relegation: []          },
}

export const LIVE_STATUSES = new Set(['1H','HT','2H','ET','P','BT'])
export const FINISHED_STATUSES = new Set(['FT','AET','PEN'])
