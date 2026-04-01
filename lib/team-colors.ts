interface KitColors {
  home: string
  away: string
}

export const FALLBACK_COLOR = '#ffffff20'

// football-data.org team IDs → kit colors
const TEAM_COLORS: Record<number, KitColors> = {
  // Premier League
  57:   { home: '#EF0107', away: '#023474' }, // Arsenal
  58:   { home: '#7B003A', away: '#95BFE5' }, // Aston Villa
  1044: { home: '#DA291C', away: '#000000' }, // Bournemouth
  402:  { home: '#E30613', away: '#FFE500' }, // Brentford
  397:  { home: '#0057B8', away: '#FFCD00' }, // Brighton
  61:   { home: '#034694', away: '#AA0000' }, // Chelsea
  354:  { home: '#1B458F', away: '#A7A5A6' }, // Crystal Palace
  62:   { home: '#003399', away: '#E5E5E5' }, // Everton
  63:   { home: '#FFFFFF', away: '#000000' }, // Fulham
  64:   { home: '#C8102E', away: '#F6EB61' }, // Liverpool
  65:   { home: '#6CABDD', away: '#1C2C5B' }, // Man City
  66:   { home: '#DA291C', away: '#000000' }, // Man United
  67:   { home: '#241F20', away: '#FFFFFF' }, // Newcastle
  351:  { home: '#DD0000', away: '#FFFFFF' }, // Nottm Forest
  73:   { home: '#132257', away: '#FFFFFF' }, // Tottenham
  563:  { home: '#7A263A', away: '#1BB1E7' }, // West Ham
  76:   { home: '#FDB913', away: '#231F20' }, // Wolves
  // La Liga
  81:   { home: '#004D98', away: '#A50044' }, // Barcelona
  86:   { home: '#FFFFFF', away: '#000080' }, // Real Madrid
  78:   { home: '#CB3524', away: '#1A3668' }, // Atletico Madrid
  559:  { home: '#FFFFFF', away: '#D4021D' }, // Sevilla
  90:   { home: '#00954C', away: '#FFFFFF' }, // Real Betis
  95:   { home: '#FF7500', away: '#000000' }, // Valencia
  94:   { home: '#FFE135', away: '#004F9E' }, // Villarreal
  77:   { home: '#EE2523', away: '#FFFFFF' }, // Athletic Club
  92:   { home: '#005FA5', away: '#FFFFFF' }, // Real Sociedad
  // Bundesliga
  5:    { home: '#DC052D', away: '#0066B2' }, // Bayern Munich
  4:    { home: '#FDE100', away: '#000000' }, // Dortmund
  721:  { home: '#DD0741', away: '#FFFFFF' }, // Leipzig
  3:    { home: '#E32221', away: '#000000' }, // Leverkusen
  19:   { home: '#E1000F', away: '#000000' }, // Frankfurt
  11:   { home: '#009856', away: '#FFFFFF' }, // Wolfsburg
  17:   { home: '#E60026', away: '#FFFFFF' }, // Freiburg
  28:   { home: '#EB1923', away: '#FFFFFF' }, // Union Berlin
  // Serie A
  109:  { home: '#000000', away: '#FFFFFF' }, // Juventus
  108:  { home: '#010E80', away: '#000000' }, // Inter Milan
  98:   { home: '#FB090B', away: '#FFFFFF' }, // AC Milan
  113:  { home: '#12A0D7', away: '#FFFFFF' }, // Napoli
  100:  { home: '#8B1A1A', away: '#F9D516' }, // Roma
  110:  { home: '#87CEEB', away: '#FFFFFF' }, // Lazio
  99:   { home: '#5E2D79', away: '#FFFFFF' }, // Fiorentina
  102:  { home: '#1E73BE', away: '#000000' }, // Atalanta
  // Ligue 1
  524:  { home: '#004170', away: '#DA291C' }, // PSG
  548:  { home: '#CE1126', away: '#FFFFFF' }, // Monaco
  516:  { home: '#009EDB', away: '#FFFFFF' }, // Marseille
  523:  { home: '#FFFFFF', away: '#003087' }, // Lyon
  521:  { home: '#DA291C', away: '#FFFFFF' }, // Lille
  522:  { home: '#000000', away: '#DA291C' }, // Nice
  529:  { home: '#E9002C', away: '#FFFFFF' }, // Rennes
}

export function getKitColor(teamId: number, isHome: boolean): string {
  const colors = TEAM_COLORS[teamId]
  if (!colors) return FALLBACK_COLOR
  return isHome ? colors.home : colors.away
}
