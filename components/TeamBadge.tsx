import { BARCA_ID } from '@/lib/leagues'
import { getKitColor } from '@/lib/team-colors'
import styles from './TeamBadge.module.css'

interface TeamBadgeProps {
  teamId: number
  teamName: string
  isHome: boolean
  size?: number
}

export default function TeamBadge({ teamId, teamName: _name, isHome, size = 24 }: TeamBadgeProps) {
  const isBarca = teamId === BARCA_ID
  const color = isBarca ? undefined : getKitColor(teamId, isHome)

  return (
    <span
      className={`${styles.badge} ${isBarca ? styles.barca : ''}`}
      style={{
        width: size,
        height: size,
        ...(isBarca ? {} : { background: color }),
      }}
      aria-hidden="true"
    />
  )
}
