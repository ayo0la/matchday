export interface NotificationPrefs {
  mutedLeagues: string[]
  favoriteTeams: number[]
}

const KEY = 'matchday_notification_prefs'
const DEFAULT: NotificationPrefs = { mutedLeagues: [], favoriteTeams: [] }

export function getPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT }
  }
}

export function setPrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}
