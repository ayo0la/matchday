import TeamBadge from './TeamBadge'
import { LIVE_STATUSES, FINISHED_STATUSES } from '@/lib/leagues'
import type { NormalizedMatch } from '@/lib/api-football'
import styles from './MatchCard.module.css'

interface MatchCardProps { match: NormalizedMatch }

export default function MatchCard({ match }: MatchCardProps) {
  const isLive = LIVE_STATUSES.has(match.status)
  const isFinished = FINISHED_STATUSES.has(match.status)
  const dim = isFinished && !isLive

  const cardClass = [
    styles.card,
    isLive ? styles.cardLive : '',
    isFinished ? styles.cardFinished : '',
  ].join(' ')

  const scoreDisplay =
    match.homeScore !== null && match.awayScore !== null
      ? `${match.homeScore} – ${match.awayScore}`
      : '– –'

  const minuteLabel =
    match.status === 'HT' ? 'HT' :
    match.status === 'FT' ? 'FT' :
    match.status === 'AET' ? 'AET' :
    match.minute ? `${match.minute}'` :
    match.status

  return (
    <div className={cardClass}>
      <div className={styles.row}>
        <div className={styles.team}>
          <TeamBadge teamId={match.homeTeam.id} teamName={match.homeTeam.name} isHome={true} />
          <span className={`${styles.teamName} ${dim ? styles.teamNameDim : ''}`}>
            {match.homeTeam.name}
          </span>
        </div>

        <div className={styles.scoreBlock}>
          <div className={`${styles.score} ${dim ? styles.scoreDim : ''}`}>{scoreDisplay}</div>
          <div className={`${styles.minute} ${dim ? styles.minuteDim : ''}`}>{minuteLabel}</div>
        </div>

        <div className={`${styles.team} ${styles.teamAway}`}>
          <span className={`${styles.teamName} ${dim ? styles.teamNameDim : ''}`}>
            {match.awayTeam.name}
          </span>
          <TeamBadge teamId={match.awayTeam.id} teamName={match.awayTeam.name} isHome={false} />
        </div>
      </div>

      {(match.stadium || match.round) && (
        <div className={styles.footer}>
          <span>{match.stadium?.toUpperCase() ?? ''}</span>
          <span>{match.round?.toUpperCase() ?? ''}</span>
        </div>
      )}
    </div>
  )
}
