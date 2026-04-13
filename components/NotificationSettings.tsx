'use client'

import { useState, useEffect } from 'react'
import { LEAGUES } from '@/lib/leagues'
import type { NotificationPrefs } from '@/lib/notification-prefs'
import styles from './NotificationSettings.module.css'

interface NotificationSettingsProps {
  prefs: NotificationPrefs
  onToggleLeague: (leagueId: string) => void
  onToggleFavoriteTeam: (teamId: number) => void
  availableTeams: { id: number; name: string }[]
  onClose: () => void
}

export default function NotificationSettings({
  prefs,
  onToggleLeague,
  onToggleFavoriteTeam,
  availableTeams,
  onClose,
}: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
  }, [])

  async function requestPermission() {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const favoriteTeamObjects = availableTeams.filter(t => prefs.favoriteTeams.includes(t.id))
  const unfavoritedTeams = availableTeams.filter(t => !prefs.favoriteTeams.includes(t.id))

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <h2 className={styles.title}>NOTIFICATIONS</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>BROWSER ALERTS</h3>
          {permission === 'granted' && (
            <p className={styles.permGranted}>Browser notifications enabled</p>
          )}
          {permission === 'denied' && (
            <p className={styles.permDenied}>Blocked — enable in your browser settings</p>
          )}
          {permission === 'default' && (
            <button className={styles.enableBtn} onClick={requestPermission}>
              Enable browser notifications
            </button>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>LEAGUES</h3>
          {LEAGUES.map(league => (
            <div key={league.id} className={styles.row}>
              <span className={styles.rowLabel}>{league.name}</span>
              <button
                className={`${styles.toggle} ${
                  prefs.mutedLeagues.includes(league.id) ? styles.toggleOff : styles.toggleOn
                }`}
                onClick={() => onToggleLeague(league.id)}
              >
                {prefs.mutedLeagues.includes(league.id) ? 'OFF' : 'ON'}
              </button>
            </div>
          ))}
        </section>

        {availableTeams.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>FAVORITE TEAMS</h3>
            {favoriteTeamObjects.map(team => (
              <div key={team.id} className={styles.row}>
                <span className={styles.rowLabel}>★ {team.name}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => onToggleFavoriteTeam(team.id)}
                >
                  Remove
                </button>
              </div>
            ))}
            {unfavoritedTeams.map(team => (
              <div key={team.id} className={styles.row}>
                <span className={`${styles.rowLabel} ${styles.rowLabelMuted}`}>{team.name}</span>
                <button
                  className={styles.addBtn}
                  onClick={() => onToggleFavoriteTeam(team.id)}
                >
                  + Fav
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
