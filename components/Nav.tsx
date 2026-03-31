import Link from 'next/link'
import styles from './Nav.module.css'

interface NavProps {
  active: 'scores' | 'standings' | 'fixtures'
  hasLive?: boolean
}

export default function Nav({ active, hasLive = false }: NavProps) {
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

      {hasLive ? (
        <div className={styles.liveIndicator}>
          <div className={styles.liveDot} />
          <span className={styles.liveLabel}>LIVE</span>
        </div>
      ) : (
        <div className={styles.placeholder} />
      )}
    </nav>
  )
}
