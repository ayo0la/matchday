'use client'

import { LEAGUES } from '@/lib/leagues'
import { getEventLabel } from '@/lib/diff-matches'
import type { Toast } from '@/hooks/useToasts'
import styles from './Toast.module.css'

interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

export default function ToastItem({ toast, onDismiss }: ToastProps) {
  const { event, isFavorite } = toast
  const leagueName = LEAGUES.find(l => l.id === event.leagueId)?.name ?? event.leagueId
  const label = getEventLabel(event.type)
  const scoreStr =
    event.homeScore !== null && event.awayScore !== null
      ? `${event.homeScore}–${event.awayScore}`
      : null

  const homeIsScorer = event.type === 'GOAL' && event.scoringTeam?.id === event.homeTeam.id
  const awayIsScorer = event.type === 'GOAL' && event.scoringTeam?.id === event.awayTeam.id

  return (
    <div className={styles.toast} onClick={() => onDismiss(toast.id)} role="status" aria-live="polite">
      <div className={styles.header}>
        <span className={styles.league}>{isFavorite ? '★ ' : ''}{leagueName}</span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.body}>
        {homeIsScorer
          ? <strong>{event.homeTeam.name}</strong>
          : <span>{event.homeTeam.name}</span>
        }
        {scoreStr && <span className={styles.score}>{scoreStr}</span>}
        {awayIsScorer
          ? <strong>{event.awayTeam.name}</strong>
          : <span>{event.awayTeam.name}</span>
        }
      </div>
    </div>
  )
}
