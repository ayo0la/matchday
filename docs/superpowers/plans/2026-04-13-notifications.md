# Matchday Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-app toast notifications and OS-level browser notifications for match events (goals, kick off, half time, full time, status changes), with per-league muting and favorite team highlighting.

**Architecture:** On each 60s poll in `page.tsx`, diff the new match array against the previous poll using a pure `diffMatches` function. Filter events through localStorage-backed preferences (muted leagues, favorite teams). Fire in-app toasts (rendered in `page.tsx`) and OS Notification API alerts when permission is granted.

**Tech Stack:** Next.js 16, React 19, TypeScript, Jest + ts-jest, CSS Modules, Web Notification API, localStorage

---

## File Map

**New files:**
- `lib/diff-matches.ts` — pure match diff function + `NotificationEvent` type + `getEventLabel` helper
- `lib/notification-prefs.ts` — localStorage read/write for `NotificationPrefs`
- `hooks/useNotificationPrefs.ts` — React hook wrapping notification-prefs
- `hooks/useToasts.ts` — React hook managing toast queue state
- `components/Toast.tsx` — single toast card
- `components/Toast.module.css` — toast styles
- `components/ToastContainer.tsx` — fixed overlay rendering the toast stack
- `components/ToastContainer.module.css` — container styles
- `components/NotificationSettings.tsx` — settings modal
- `components/NotificationSettings.module.css` — settings styles
- `__tests__/diff-matches.test.ts` — tests for diffMatches
- `__tests__/notification-prefs.test.ts` — tests for notification-prefs localStorage helpers

**Modified files:**
- `app/page.tsx` — add diff logic, event dispatch, toast + settings rendering
- `components/Nav.tsx` — add `onBellClick` prop + bell button
- `components/Nav.module.css` — styles for bell button and right section

---

## Task 1: `lib/diff-matches.ts` — event detection

**Files:**
- Create: `lib/diff-matches.ts`
- Test: `__tests__/diff-matches.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/diff-matches.test.ts`:

```typescript
import { diffMatches, type NotificationEvent } from '@/lib/diff-matches'
import type { NormalizedMatch } from '@/lib/api-football'

function makeMatch(overrides: Partial<NormalizedMatch> = {}): NormalizedMatch {
  return {
    id: 1,
    homeTeam: { id: 10, name: 'Arsenal' },
    awayTeam: { id: 20, name: 'Chelsea' },
    homeScore: 0,
    awayScore: 0,
    status: '1H',
    minute: null,
    stadium: null,
    round: 'Matchday 1',
    leagueId: 'PL',
    date: '2026-04-13T15:00:00Z',
    ...overrides,
  }
}

describe('diffMatches', () => {
  it('returns empty array when prev and next are identical', () => {
    const match = makeMatch()
    expect(diffMatches([match], [match])).toEqual([])
  })

  it('returns empty array when prev is empty', () => {
    const match = makeMatch()
    expect(diffMatches([], [match])).toEqual([])
  })

  it('returns empty array when next is empty', () => {
    const match = makeMatch()
    expect(diffMatches([match], [])).toEqual([])
  })

  it('detects GOAL when home score increases', () => {
    const prev = makeMatch({ homeScore: 0, awayScore: 0, status: '1H' })
    const next = makeMatch({ homeScore: 1, awayScore: 0, status: '1H' })
    const events = diffMatches([prev], [next])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('GOAL')
    expect(events[0].scoringTeam).toEqual({ id: 10, name: 'Arsenal' })
    expect(events[0].homeScore).toBe(1)
    expect(events[0].awayScore).toBe(0)
  })

  it('detects GOAL when away score increases', () => {
    const prev = makeMatch({ homeScore: 1, awayScore: 0, status: '1H' })
    const next = makeMatch({ homeScore: 1, awayScore: 1, status: '1H' })
    const events = diffMatches([prev], [next])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('GOAL')
    expect(events[0].scoringTeam).toEqual({ id: 20, name: 'Chelsea' })
  })

  it('emits GOAL (not STATUS_CHANGE) when score changes alongside status change', () => {
    const prev = makeMatch({ homeScore: 0, awayScore: 0, status: 'NS' })
    const next = makeMatch({ homeScore: 1, awayScore: 0, status: '1H' })
    const events = diffMatches([prev], [next])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('GOAL')
  })

  it('detects KICK_OFF when status moves from NS to 1H', () => {
    const prev = makeMatch({ status: 'NS' })
    const next = makeMatch({ status: '1H' })
    const events = diffMatches([prev], [next])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('KICK_OFF')
  })

  it('detects KICK_OFF when status moves from NS to ET', () => {
    const prev = makeMatch({ status: 'NS' })
    const next = makeMatch({ status: 'ET' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('KICK_OFF')
  })

  it('detects HALF_TIME when status becomes HT', () => {
    const prev = makeMatch({ status: '1H' })
    const next = makeMatch({ status: 'HT' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('HALF_TIME')
  })

  it('detects FULL_TIME when status becomes FT', () => {
    const prev = makeMatch({ status: '1H' })
    const next = makeMatch({ status: 'FT' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('FULL_TIME')
  })

  it('detects FULL_TIME when status becomes AET', () => {
    const prev = makeMatch({ status: 'ET' })
    const next = makeMatch({ status: 'AET' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('FULL_TIME')
  })

  it('detects FULL_TIME when status becomes PEN', () => {
    const prev = makeMatch({ status: 'ET' })
    const next = makeMatch({ status: 'PEN' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('FULL_TIME')
  })

  it('detects STATUS_CHANGE for SUSP', () => {
    const prev = makeMatch({ status: '1H' })
    const next = makeMatch({ status: 'SUSP' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('STATUS_CHANGE')
  })

  it('detects STATUS_CHANGE for PST', () => {
    const prev = makeMatch({ status: 'NS' })
    const next = makeMatch({ status: 'PST' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('STATUS_CHANGE')
  })

  it('detects STATUS_CHANGE for CANC', () => {
    const prev = makeMatch({ status: 'NS' })
    const next = makeMatch({ status: 'CANC' })
    const events = diffMatches([prev], [next])
    expect(events[0].type).toBe('STATUS_CHANGE')
  })

  it('emits events for multiple matches', () => {
    const prev = [
      makeMatch({ id: 1, homeScore: 0, awayScore: 0, status: '1H' }),
      makeMatch({ id: 2, homeScore: 0, awayScore: 0, status: 'NS' }),
    ]
    const next = [
      makeMatch({ id: 1, homeScore: 1, awayScore: 0, status: '1H' }),
      makeMatch({ id: 2, homeScore: 0, awayScore: 0, status: '1H' }),
    ]
    const events = diffMatches(prev, next)
    expect(events).toHaveLength(2)
    expect(events.find(e => e.matchId === 1)?.type).toBe('GOAL')
    expect(events.find(e => e.matchId === 2)?.type).toBe('KICK_OFF')
  })

  it('includes leagueId on every event', () => {
    const prev = makeMatch({ status: 'NS', leagueId: 'PD' })
    const next = makeMatch({ status: '1H', leagueId: 'PD' })
    const events = diffMatches([prev], [next])
    expect(events[0].leagueId).toBe('PD')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest __tests__/diff-matches.test.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '@/lib/diff-matches'`

- [ ] **Step 3: Implement `lib/diff-matches.ts`**

```typescript
import type { NormalizedMatch, MatchStatus } from '@/lib/api-football'
import { LIVE_STATUSES, FINISHED_STATUSES } from '@/lib/leagues'

export type EventType = 'GOAL' | 'KICK_OFF' | 'HALF_TIME' | 'FULL_TIME' | 'STATUS_CHANGE'

export interface NotificationEvent {
  type: EventType
  matchId: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  homeScore: number | null
  awayScore: number | null
  scoringTeam?: { id: number; name: string }
  newStatus: MatchStatus
  leagueId: string
}

export function getEventLabel(type: EventType): string {
  switch (type) {
    case 'GOAL':          return 'GOAL'
    case 'KICK_OFF':      return 'KICK OFF'
    case 'HALF_TIME':     return 'HALF TIME'
    case 'FULL_TIME':     return 'FULL TIME'
    case 'STATUS_CHANGE': return 'UPDATE'
  }
}

export function diffMatches(
  prev: NormalizedMatch[],
  next: NormalizedMatch[]
): NotificationEvent[] {
  const prevMap = new Map(prev.map(m => [m.id, m]))
  const events: NotificationEvent[] = []

  for (const match of next) {
    const old = prevMap.get(match.id)
    if (!old) continue

    const base = {
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      newStatus: match.status,
      leagueId: match.leagueId,
    }

    const homeGoal = (match.homeScore ?? 0) > (old.homeScore ?? 0)
    const awayGoal = (match.awayScore ?? 0) > (old.awayScore ?? 0)

    if (homeGoal || awayGoal) {
      events.push({
        type: 'GOAL',
        ...base,
        scoringTeam: homeGoal ? match.homeTeam : match.awayTeam,
      })
      continue
    }

    if (old.status === match.status) continue

    if (!LIVE_STATUSES.has(old.status) && LIVE_STATUSES.has(match.status)) {
      events.push({ type: 'KICK_OFF', ...base })
    } else if (match.status === 'HT') {
      events.push({ type: 'HALF_TIME', ...base })
    } else if (FINISHED_STATUSES.has(match.status)) {
      events.push({ type: 'FULL_TIME', ...base })
    } else {
      events.push({ type: 'STATUS_CHANGE', ...base })
    }
  }

  return events
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest __tests__/diff-matches.test.ts --no-coverage 2>&1 | tail -10
```

Expected: PASS — all 16 tests green

- [ ] **Step 5: Commit**

```bash
cd /Users/ayoola/Desktop/matchday && git add lib/diff-matches.ts __tests__/diff-matches.test.ts && git commit -m "feat: add diffMatches — pure match event detection"
```

---

## Task 2: `lib/notification-prefs.ts` — localStorage helpers

**Files:**
- Create: `lib/notification-prefs.ts`
- Test: `__tests__/notification-prefs.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/notification-prefs.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest __tests__/notification-prefs.test.ts --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '@/lib/notification-prefs'`

- [ ] **Step 3: Implement `lib/notification-prefs.ts`**

```typescript
export interface NotificationPrefs {
  mutedLeagues: string[]
  favoriteTeams: number[]
}

const KEY = 'matchday_notification_prefs'
const DEFAULT: NotificationPrefs = { mutedLeagues: [], favoriteTeams: [] }

export function getPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return DEFAULT
  }
}

export function setPrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest __tests__/notification-prefs.test.ts --no-coverage 2>&1 | tail -10
```

Expected: PASS — all 6 tests green

- [ ] **Step 5: Commit**

```bash
cd /Users/ayoola/Desktop/matchday && git add lib/notification-prefs.ts __tests__/notification-prefs.test.ts && git commit -m "feat: add notification-prefs — localStorage read/write helpers"
```

---

## Task 3: `hooks/useNotificationPrefs.ts` — prefs React hook

**Files:**
- Create: `hooks/useNotificationPrefs.ts`

(No automated test — logic is fully covered by Task 2's pure function tests. The hook is a thin React wrapper.)

- [ ] **Step 1: Create the hooks directory and file**

```bash
mkdir -p /Users/ayoola/Desktop/matchday/hooks
```

Create `hooks/useNotificationPrefs.ts`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { getPrefs, setPrefs, type NotificationPrefs } from '@/lib/notification-prefs'

export function useNotificationPrefs() {
  const [prefs, setPrefsState] = useState<NotificationPrefs>(getPrefs)

  const toggleLeague = useCallback((leagueId: string) => {
    setPrefsState(prev => {
      const muted = prev.mutedLeagues.includes(leagueId)
        ? prev.mutedLeagues.filter(id => id !== leagueId)
        : [...prev.mutedLeagues, leagueId]
      const next = { ...prev, mutedLeagues: muted }
      setPrefs(next)
      return next
    })
  }, [])

  const toggleFavoriteTeam = useCallback((teamId: number) => {
    setPrefsState(prev => {
      const favoriteTeams = prev.favoriteTeams.includes(teamId)
        ? prev.favoriteTeams.filter(id => id !== teamId)
        : [...prev.favoriteTeams, teamId]
      const next = { ...prev, favoriteTeams }
      setPrefs(next)
      return next
    })
  }, [])

  return { prefs, toggleLeague, toggleFavoriteTeam }
}
```

- [ ] **Step 2: Confirm existing tests still pass**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest --no-coverage 2>&1 | tail -10
```

Expected: PASS — all prior tests still green

- [ ] **Step 3: Commit**

```bash
cd /Users/ayoola/Desktop/matchday && git add hooks/useNotificationPrefs.ts && git commit -m "feat: add useNotificationPrefs hook"
```

---

## Task 4: `hooks/useToasts.ts` — toast queue hook

**Files:**
- Create: `hooks/useToasts.ts`

- [ ] **Step 1: Create `hooks/useToasts.ts`**

```typescript
'use client'

import { useState, useCallback } from 'react'
import type { NotificationEvent } from '@/lib/diff-matches'

export interface Toast {
  id: string
  event: NotificationEvent
  isFavorite: boolean
}

const MAX_TOASTS = 4

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((event: NotificationEvent, isFavorite: boolean) => {
    const id = `${event.matchId}-${event.type}-${Date.now()}`
    setToasts(prev => [{ id, event, isFavorite }, ...prev].slice(0, MAX_TOASTS))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, dismissToast }
}
```

- [ ] **Step 2: Confirm existing tests still pass**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest --no-coverage 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/ayoola/Desktop/matchday && git add hooks/useToasts.ts && git commit -m "feat: add useToasts hook — toast queue with auto-dismiss"
```

---

## Task 5: `components/Toast.tsx` + `components/Toast.module.css`

**Files:**
- Create: `components/Toast.tsx`
- Create: `components/Toast.module.css`

- [ ] **Step 1: Create `components/Toast.module.css`**

```css
.toast {
  background: var(--card-bg);
  border: 1px solid var(--border-card);
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  min-width: 260px;
  max-width: 320px;
  animation: slideIn 0.2s ease-out;
  user-select: none;
}

.toast:hover {
  border-color: var(--text-muted);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.league {
  font-size: 10px;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--red);
}

.body {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text);
  flex-wrap: wrap;
}

.score {
  color: var(--text-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

@keyframes slideIn {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

- [ ] **Step 2: Create `components/Toast.tsx`**

```typescript
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
```

- [ ] **Step 3: Confirm existing tests still pass**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest --no-coverage 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/Desktop/matchday && git add components/Toast.tsx components/Toast.module.css && git commit -m "feat: add Toast component"
```

---

## Task 6: `components/ToastContainer.tsx` + `components/ToastContainer.module.css`

**Files:**
- Create: `components/ToastContainer.tsx`
- Create: `components/ToastContainer.module.css`

- [ ] **Step 1: Create `components/ToastContainer.module.css`**

```css
.container {
  position: fixed;
  top: 72px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  pointer-events: none;
}

.container > * {
  pointer-events: all;
}
```

- [ ] **Step 2: Create `components/ToastContainer.tsx`**

```typescript
'use client'

import type { Toast } from '@/hooks/useToasts'
import ToastItem from './Toast'
import styles from './ToastContainer.module.css'

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Confirm existing tests still pass**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest --no-coverage 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/Desktop/matchday && git add components/ToastContainer.tsx components/ToastContainer.module.css && git commit -m "feat: add ToastContainer component"
```

---

## Task 7: `components/NotificationSettings.tsx` + CSS

**Files:**
- Create: `components/NotificationSettings.tsx`
- Create: `components/NotificationSettings.module.css`

- [ ] **Step 1: Create `components/NotificationSettings.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.panel {
  background: var(--nav-bg);
  border-left: 1px solid var(--border-card);
  width: 300px;
  height: 100vh;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panelHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);
}

.closeBtn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.closeBtn:hover {
  color: var(--text);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sectionTitle {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text-secondary);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rowLabel {
  font-size: 13px;
  color: var(--text);
}

.rowLabelMuted {
  color: var(--text-secondary);
}

.toggle {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.toggleOn {
  background: var(--blue);
  color: #fff;
}

.toggleOff {
  background: var(--card-bg);
  color: var(--text-muted);
  border: 1px solid var(--border-card);
}

.enableBtn {
  background: var(--blue);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}

.enableBtn:hover {
  opacity: 0.85;
}

.permGranted {
  font-size: 12px;
  color: #4ade80;
}

.permDenied {
  font-size: 12px;
  color: var(--text-secondary);
}

.addBtn {
  font-size: 11px;
  background: none;
  border: 1px solid var(--border-card);
  color: var(--text-muted);
  border-radius: 4px;
  padding: 3px 7px;
  cursor: pointer;
}

.addBtn:hover {
  color: var(--text);
  border-color: var(--text-muted);
}

.removeBtn {
  font-size: 11px;
  background: none;
  border: 1px solid var(--border-card);
  color: var(--red);
  border-radius: 4px;
  padding: 3px 7px;
  cursor: pointer;
}

.removeBtn:hover {
  opacity: 0.75;
}
```

- [ ] **Step 2: Create `components/NotificationSettings.tsx`**

```typescript
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
```

- [ ] **Step 3: Confirm existing tests still pass**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest --no-coverage 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/Desktop/matchday && git add components/NotificationSettings.tsx components/NotificationSettings.module.css && git commit -m "feat: add NotificationSettings panel"
```

---

## Task 8: Update `components/Nav.tsx` + `components/Nav.module.css`

**Files:**
- Modify: `components/Nav.tsx`
- Modify: `components/Nav.module.css`

- [ ] **Step 1: Update `components/Nav.module.css`**

Replace the `.placeholder` rule and add `.right` + `.bellBtn`:

Find and replace this block:
```css
.placeholder { min-width: 60px; }
```

With:
```css
.right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 60px;
  justify-content: flex-end;
}

.bellBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.bellBtn:hover {
  opacity: 1;
}
```

- [ ] **Step 2: Update `components/Nav.tsx`**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 3: Confirm existing tests still pass**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest --no-coverage 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/Desktop/matchday && git add components/Nav.tsx components/Nav.module.css && git commit -m "feat: add bell button to Nav for notification settings"
```

---

## Task 9: Wire `app/page.tsx` — diff, dispatch, render

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx` with the wired-up version**

```typescript
'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Nav from '@/components/Nav'
import LeagueFilter from '@/components/LeagueFilter'
import MatchCard from '@/components/MatchCard'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'
import ToastContainer from '@/components/ToastContainer'
import NotificationSettings from '@/components/NotificationSettings'
import { LIVE_STATUSES, LEAGUES } from '@/lib/leagues'
import { diffMatches } from '@/lib/diff-matches'
import { useNotificationPrefs } from '@/hooks/useNotificationPrefs'
import { useToasts } from '@/hooks/useToasts'
import type { NormalizedMatch } from '@/lib/api-football'
import type { NotificationEvent } from '@/lib/diff-matches'

const DEFAULT_LEAGUE = LEAGUES[0].id

function sortMatches(matches: NormalizedMatch[]): NormalizedMatch[] {
  const order = (m: NormalizedMatch) =>
    LIVE_STATUSES.has(m.status) ? 0 : m.status === 'NS' ? 1 : 2
  return [...matches].sort((a, b) => order(a) - order(b))
}

function fireOsNotification(event: NotificationEvent) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  const title =
    event.type === 'GOAL' && event.scoringTeam
      ? `GOAL — ${event.scoringTeam.name}`
      : `${event.homeTeam.name} vs ${event.awayTeam.name}`

  const score =
    event.homeScore !== null && event.awayScore !== null
      ? `${event.homeScore}–${event.awayScore}`
      : null

  const body = score
    ? `${event.homeTeam.name} ${score} ${event.awayTeam.name}`
    : `${event.homeTeam.name} vs ${event.awayTeam.name}`

  new Notification(title, { body, icon: '/favicon.ico' })
}

export default function ScoresPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>(DEFAULT_LEAGUE)
  const [matches, setMatches] = useState<NormalizedMatch[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const prevMatches = useRef<NormalizedMatch[]>([])
  const { prefs, toggleLeague, toggleFavoriteTeam } = useNotificationPrefs()
  const { toasts, addToast, dismissToast } = useToasts()

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/scores?league=${selectedLeague}`)
      if (!res.ok) throw new Error()
      const data: NormalizedMatch[] = await res.json()
      const sorted = sortMatches(data)

      const events = diffMatches(prevMatches.current, data)
      for (const event of events) {
        if (prefs.mutedLeagues.includes(event.leagueId)) continue
        const isFavorite =
          prefs.favoriteTeams.includes(event.homeTeam.id) ||
          prefs.favoriteTeams.includes(event.awayTeam.id)
        addToast(event, isFavorite)
        fireOsNotification(event)
      }
      prevMatches.current = data

      setMatches(sorted)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedLeague, prefs, addToast])

  useEffect(() => {
    setLoading(true)
    prevMatches.current = []
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  const hasLive = matches.some(m => LIVE_STATUSES.has(m.status))

  const availableTeams = useMemo(() => {
    const seen = new Map<number, string>()
    for (const m of matches) {
      seen.set(m.homeTeam.id, m.homeTeam.name)
      seen.set(m.awayTeam.id, m.awayTeam.name)
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [matches])

  return (
    <>
      <Nav active="scores" hasLive={hasLive} onBellClick={() => setShowSettings(true)} />
      <LeagueFilter selected={selectedLeague} onChange={setSelectedLeague} />

      <main style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {error && <ErrorState />}
        {!error && !loading && matches.length === 0 && (
          <EmptyState message="No matches today for this league." />
        )}
        {matches.map(m => <MatchCard key={m.id} match={m} />)}
      </main>

      <footer style={{ padding: '12px 24px', borderTop: '1px solid var(--border-divider)', textAlign: 'center' }}>
        <span style={{ color: '#333', fontSize: 10, letterSpacing: 1 }}>DATA: FOOTBALL-DATA.ORG · REFRESHES EVERY 60s</span>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showSettings && (
        <NotificationSettings
          prefs={prefs}
          onToggleLeague={toggleLeague}
          onToggleFavoriteTeam={toggleFavoriteTeam}
          availableTeams={availableTeams}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
cd /Users/ayoola/Desktop/matchday && npx jest --no-coverage 2>&1 | tail -15
```

Expected: PASS — all tests green (diff-matches: 16, notification-prefs: 6, plus existing 19 = 41 total)

- [ ] **Step 3: Build to verify TypeScript compiles**

```bash
cd /Users/ayoola/Desktop/matchday && npx next build 2>&1 | tail -20
```

Expected: successful build with no type errors

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/Desktop/matchday && git add app/page.tsx && git commit -m "feat: wire notifications into scores page — toasts, OS alerts, settings"
```

---

## Self-Review Checklist

After all tasks are done:

- [ ] Run full test suite: `npx jest --no-coverage`
- [ ] Run build: `npx next build`
- [ ] Manual smoke test: start dev server (`npm run dev`), open scores page, verify bell icon appears in Nav, open settings panel, toggle a league, add a favorite team, confirm preferences persist on refresh
