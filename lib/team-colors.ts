interface KitColors {
  home: string
  away: string
}

export const FALLBACK_COLOR = '#ffffff20'

// API-Football team IDs → kit colors
const TEAM_COLORS: Record<number, KitColors> = {
  // Premier League
  42: { home: '#EF0107', away: '#023474' }, // Arsenal
  66: { home: '#7B003A', away: '#95BFE5' }, // Aston Villa
  35: { home: '#DA291C', away: '#000000' }, // Bournemouth
  55: { home: '#E30613', away: '#FFE500' }, // Brentford
  51: { home: '#0057B8', away: '#FFCD00' }, // Brighton
  49: { home: '#034694', away: '#AA0000' }, // Chelsea
  52: { home: '#1B458F', away: '#A7A5A6' }, // Crystal Palace
  45: { home: '#003399', away: '#E5E5E5' }, // Everton
  36: { home: '#FFFFFF', away: '#000000' }, // Fulham
  46: { home: '#003090', away: '#FDBE11' }, // Leicester
  40: { home: '#C8102E', away: '#F6EB61' }, // Liverpool
  50: { home: '#6CABDD', away: '#1C2C5B' }, // Man City
  33: { home: '#DA291C', away: '#000000' }, // Man United
  34: { home: '#241F20', away: '#FFFFFF' }, // Newcastle
  65: { home: '#DD0000', away: '#FFFFFF' }, // Nottm Forest
  41: { home: '#D71920', away: '#130C0E' }, // Southampton
  47: { home: '#132257', away: '#FFFFFF' }, // Tottenham
  48: { home: '#7A263A', away: '#1BB1E7' }, // West Ham
  39: { home: '#FDB913', away: '#231F20' }, // Wolves
  // La Liga
  529: { home: '#004D98', away: '#A50044' }, // Barcelona
  541: { home: '#FFFFFF', away: '#000080' }, // Real Madrid
  530: { home: '#CB3524', away: '#1A3668' }, // Atletico Madrid
  536: { home: '#FFFFFF', away: '#D4021D' }, // Sevilla
  543: { home: '#00954C', away: '#FFFFFF' }, // Real Betis
  532: { home: '#FF7500', away: '#000000' }, // Valencia
  533: { home: '#FFE135', away: '#004F9E' }, // Villarreal
  531: { home: '#EE2523', away: '#FFFFFF' }, // Athletic Bilbao
  548: { home: '#005FA5', away: '#FFFFFF' }, // Real Sociedad
  // Bundesliga
  157: { home: '#DC052D', away: '#0066B2' }, // Bayern Munich
  165: { home: '#FDE100', away: '#000000' }, // Dortmund
  173: { home: '#DD0741', away: '#FFFFFF' }, // Leipzig
  168: { home: '#E32221', away: '#000000' }, // Leverkusen
  169: { home: '#E1000F', away: '#000000' }, // Frankfurt
  161: { home: '#009856', away: '#FFFFFF' }, // Wolfsburg
  160: { home: '#E60026', away: '#FFFFFF' }, // Freiburg
  182: { home: '#EB1923', away: '#FFFFFF' }, // Union Berlin
  // Serie A
  496: { home: '#000000', away: '#FFFFFF' }, // Juventus
  505: { home: '#010E80', away: '#000000' }, // Inter Milan
  489: { home: '#FB090B', away: '#FFFFFF' }, // AC Milan
  492: { home: '#12A0D7', away: '#FFFFFF' }, // Napoli
  497: { home: '#8B1A1A', away: '#F9D516' }, // Roma
  487: { home: '#87CEEB', away: '#FFFFFF' }, // Lazio
  502: { home: '#5E2D79', away: '#FFFFFF' }, // Fiorentina
  499: { home: '#1E73BE', away: '#000000' }, // Atalanta
  // Ligue 1
  85: { home: '#004170', away: '#DA291C' }, // PSG
  91: { home: '#CE1126', away: '#FFFFFF' }, // Monaco
  81: { home: '#009EDB', away: '#FFFFFF' }, // Marseille
  80: { home: '#FFFFFF', away: '#003087' }, // Lyon
  94: { home: '#E9002C', away: '#FFFFFF' }, // Rennes
  84: { home: '#000000', away: '#DA291C' }, // Nice
  79: { home: '#DA291C', away: '#FFFFFF' }, // Lille
}

export function getKitColor(teamId: number, isHome: boolean): string {
  const colors = TEAM_COLORS[teamId]
  if (!colors) return FALLBACK_COLOR
  return isHome ? colors.home : colors.away
}
