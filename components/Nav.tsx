import Link from 'next/link'
import styles from './Nav.module.css'

interface NavProps {
  active: 'scores' | 'standings' | 'fixtures'
  hasLive?: boolean
  onBellClick?: () => void
}

export default function Nav({ active, hasLive = false, onBellClick }: NavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <div className={styles.logoBadge} />
        <span className={styles.logoName}>MATCHDAY</span>
      </div>

      <div className={styles.links}>
        <Link href="/" className={`${styles.link} ${active === 'scores' ? styles.linkActive : ''}`}>
          Scores
        </Link>
        <Link href="/standings" className={`${styles.link} ${active === 'standings' ? styles.linkActive : ''}`}>
          Standings
        </Link>
        <Link href="/fixtures" className={`${styles.link} ${active === 'fixtures' ? styles.linkActive : ''}`}>
          Fixtures
        </Link>
      </div>

      <div className={styles.right}>
        {hasLive && (
          <div className={styles.liveIndicator}>
            <div className={styles.liveDot} />
            <span className={styles.liveLabel}>LIVE</span>
          </div>
        )}
        {onBellClick && (
          <button className={styles.bellBtn} onClick={onBellClick} aria-label="Notification settings">
            🔔
          </button>
        )}
      </div>
    </nav>
  )
}
