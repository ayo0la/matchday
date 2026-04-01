import { LEAGUES } from '@/lib/leagues'
import styles from './LeagueFilter.module.css'

interface LeagueFilterProps {
  selected: string
  onChange: (leagueId: string) => void
  includeAll?: boolean
}

export default function LeagueFilter({ selected, onChange, includeAll = false }: LeagueFilterProps) {
  const options = includeAll
    ? [{ id: '', name: 'All Leagues' }, ...LEAGUES]
    : [...LEAGUES]

  return (
    <div className={styles.wrap}>
      {options.map((league) => (
        <button
          key={league.id}
          className={`${styles.pill} ${selected === league.id ? styles.pillActive : ''}`}
          onClick={() => onChange(league.id)}
        >
          {league.name}
        </button>
      ))}
    </div>
  )
}
