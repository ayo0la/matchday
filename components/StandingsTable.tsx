import { STANDINGS_ZONES, BARCA_ID } from '@/lib/leagues'
import TeamBadge from './TeamBadge'
import type { NormalizedStanding } from '@/lib/api-football'
import styles from './StandingsTable.module.css'

interface StandingsTableProps {
  standings: NormalizedStanding[]
  leagueId: number
}

export default function StandingsTable({ standings, leagueId }: StandingsTableProps) {
  const zones = STANDINGS_ZONES[leagueId] ?? { ucl: [], europa: [], relegation: [] }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.headerCell}>#</span>
        <span className={styles.headerCell}>Club</span>
        {['P','W','D','L','GD','PTS'].map((h) => (
          <span key={h} className={styles.headerCell}>{h}</span>
        ))}
      </div>

      {standings.map((s) => {
        const isUcl = zones.ucl.includes(s.rank)
        const isEuropa = zones.europa.includes(s.rank)
        const isRel = zones.relegation.includes(s.rank)
        const isBarca = s.teamId === BARCA_ID

        const rowClass = [
          styles.row,
          isBarca ? styles.rowBarca : '',
          isUcl ? styles.rowUcl : '',
          isEuropa ? styles.rowEuropa : '',
          isRel ? styles.rowRel : '',
        ].join(' ')

        const rankClass = [
          styles.rank,
          isUcl ? styles.rankZone : '',
          isRel ? styles.rankRel : '',
        ].join(' ')

        return (
          <div key={s.teamId} className={rowClass}>
            <span className={rankClass}>{s.rank}</span>
            <div className={styles.clubCell}>
              <TeamBadge teamId={s.teamId} teamName={s.teamName} isHome={true} size={18} />
              <span className={`${styles.clubName} ${!isBarca ? styles.clubNameDim : ''}`}>
                {s.teamName}
              </span>
            </div>
            <span className={styles.cell}>{s.played}</span>
            <span className={styles.cell}>{s.wins}</span>
            <span className={styles.cell}>{s.draws}</span>
            <span className={styles.cell}>{s.losses}</span>
            <span className={styles.cell}>{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</span>
            <span className={styles.pts}>{s.points}</span>
          </div>
        )
      })}

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: 'var(--blue)' }} />
          <span className={styles.legendLabel}>Champions League</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: 'var(--europa)' }} />
          <span className={styles.legendLabel}>Europa League</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: 'var(--red)' }} />
          <span className={styles.legendLabel}>Relegation</span>
        </div>
      </div>
    </div>
  )
}
