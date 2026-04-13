import { getPrefs, setPrefs, type NotificationPrefs } from '@/lib/notification-prefs'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

beforeEach(() => localStorageMock.clear())

describe('getPrefs', () => {
  it('returns default prefs when localStorage is empty', () => {
    const prefs = getPrefs()
    expect(prefs).toEqual({ mutedLeagues: [], favoriteTeams: [] })
  })

  it('returns stored prefs', () => {
    const stored: NotificationPrefs = { mutedLeagues: ['BL1'], favoriteTeams: [57] }
    localStorageMock.setItem('matchday_notification_prefs', JSON.stringify(stored))
    expect(getPrefs()).toEqual(stored)
  })

  it('merges stored prefs with defaults (handles partial data)', () => {
    localStorageMock.setItem('matchday_notification_prefs', JSON.stringify({ mutedLeagues: ['FL1'] }))
    const prefs = getPrefs()
    expect(prefs.mutedLeagues).toEqual(['FL1'])
    expect(prefs.favoriteTeams).toEqual([])
  })

  it('returns defaults when localStorage contains invalid JSON', () => {
    localStorageMock.setItem('matchday_notification_prefs', 'not-json')
    expect(getPrefs()).toEqual({ mutedLeagues: [], favoriteTeams: [] })
  })
})

describe('setPrefs', () => {
  it('writes prefs to localStorage as JSON', () => {
    const prefs: NotificationPrefs = { mutedLeagues: ['SA'], favoriteTeams: [81, 559] }
    setPrefs(prefs)
    const raw = localStorageMock.getItem('matchday_notification_prefs')
    expect(JSON.parse(raw!)).toEqual(prefs)
  })

  it('getPrefs reads back what setPrefs wrote', () => {
    const prefs: NotificationPrefs = { mutedLeagues: ['CL'], favoriteTeams: [65] }
    setPrefs(prefs)
    expect(getPrefs()).toEqual(prefs)
  })
})
