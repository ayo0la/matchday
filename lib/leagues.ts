export const BARCA_ID = 529

export const LEAGUES = [
  { id: 39,  name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 78,  name: 'Bundesliga' },
  { id: 135, name: 'Serie A' },
  { id: 61,  name: 'Ligue 1' },
  { id: 2,   name: 'Champions League' },
] as const

export type LeagueId = typeof LEAGUES[number]['id']

// Zone ranges per league (ranks are 1-indexed, inclusive)
export const STANDINGS_ZONES: Record<number, {
  ucl: number[]
  europa: number[]
  relegation: number[]
}> = {
  39:  { ucl: [1,2,3,4],   europa: [5,6],   relegation: [18,19,20] }, // PL
  140: { ucl: [1,2,3,4],   europa: [5,6,7], relegation: [18,19,20] }, // La Liga
  78:  { ucl: [1,2,3,4],   europa: [5,6],   relegation: [17,18]    }, // Bundesliga
  135: { ucl: [1,2,3,4],   europa: [5,6,7], relegation: [18,19,20] }, // Serie A
  61:  { ucl: [1,2,3],     europa: [4,5,6], relegation: [17,18]    }, // Ligue 1
  2:   { ucl: [],          europa: [],      relegation: []          }, // UCL
}

export const LIVE_STATUSES = new Set(['1H','HT','2H','ET','P','BT'])
export const FINISHED_STATUSES = new Set(['FT','AET','PEN'])
