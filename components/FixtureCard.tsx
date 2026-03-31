import { BARCA_ID, LEAGUES } from '@/lib/leagues'
import TeamBadge from './TeamBadge'
import type { NormalizedFixture } from '@/lib/api-football'
import styles from './FixtureCard.module.css'

interface FixtureCardProps { fixture: NormalizedFixture }

export default function FixtureCard({ fixture: f }: FixtureCardProps) {
  const leagueName = LEAGUES.find((l) => l.id === f.leagueId)?.name ?? ''
  const homeIsBarca = f.homeTeam.id === BARCA_ID
  const awayIsBarca = f.awayTeam.id === BARCA_ID

  return (
    <div className={styles.card}>
      <div className={styles.team}>
        <TeamBadge teamId={f.homeTeam.id} teamName={f.homeTeam.name} isHome={true} size={20} />
        <span className={styles.teamName}
          style={homeIsBarca ? { fontWeight: 700, color: '#fff' } : {}}>
          {f.homeTeam.name}
        </span>
      </div>

      <div className={styles.middle}>
        <div className={styles.kickoff}>{f.kickoff}</div>
        <div className={styles.leagueTag}>{leagueName.toUpperCase()}</div>
      </div>

      <div className={`${styles.team} ${styles.teamAway}`}>
        <span className={styles.teamName}
          style={awayIsBarca ? { fontWeight: 700, color: '#fff' } : {}}>
          {f.awayTeam.name}
        </span>
        <TeamBadge teamId={f.awayTeam.id} teamName={f.awayTeam.name} isHome={false} size={20} />
      </div>
    </div>
  )
}
