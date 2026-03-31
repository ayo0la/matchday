import { LEAGUES } from '@/lib/leagues'
import styles from './LeagueFilter.module.css'

interface LeagueFilterProps {
  selected: number
  onChange: (leagueId: number) => void
  includeAll?: boolean
}

export default function LeagueFilter({ selected, onChange, includeAll = false }: LeagueFilterProps) {
  const options = includeAll
    ? [{ id: 0, name: 'All Leagues' }, ...LEAGUES]
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
