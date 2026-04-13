# Matchday Notifications — Design Spec

**Date:** 2026-04-13
**Scope:** In-app toast notifications + browser Notification API alerts for match events

---

## Overview

Add real-time match event notifications to Matchday. On each 60s poll, diff the new match data against the previous poll to detect goal and status change events. Fire in-app toasts when the tab is open, and OS-level browser notifications when the window is minimized. Users can mute leagues and mark favorite teams. Preferences are stored in localStorage.

---

## Event Detection (`lib/diff-matches.ts`)

A pure function `diffMatches(prev: NormalizedMatch[], next: NormalizedMatch[]): NotificationEvent[]` compares two match arrays and emits structured events for:

- **GOAL** — `homeScore` or `awayScore` increased (identifies which team scored)
- **KICK_OFF** — status entered `LIVE_STATUSES` (`1H`, `ET`)
- **HALF_TIME** — status became `HT`
- **FULL_TIME** — status entered `FINISHED_STATUSES` (`FT`, `AET`, `PEN`)
- **STATUS_CHANGE** — any other status transition (SUSP, PST, CANC, etc.)

Each event shape:

```ts
interface NotificationEvent {
  type: 'GOAL' | 'KICK_OFF' | 'HALF_TIME' | 'FULL_TIME' | 'STATUS_CHANGE'
  matchId: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  homeScore: number | null
  awayScore: number | null
  scoringTeam?: { id: number; name: string }  // GOAL events only
  newStatus: MatchStatus
  leagueId: string
}
```

This module is pure (no side effects) and fully unit-testable.

---

## Notification Preferences (`lib/notification-prefs.ts`, `hooks/useNotificationPrefs.ts`)

**localStorage key:** `matchday_notification_prefs`

**Shape:**
```ts
interface NotificationPrefs {
  mutedLeagues: string[]    // league IDs — empty array = all leagues on
  favoriteTeams: number[]   // team IDs from football-data.org
}
```

**Default:** `{ mutedLeagues: [], favoriteTeams: [] }` — all leagues on, no favorites.

`lib/notification-prefs.ts` provides `getPrefs()` and `setPrefs(prefs)` helpers (localStorage read/write with JSON parse/stringify).

`useNotificationPrefs` hook exposes:
- `prefs: NotificationPrefs`
- `toggleLeague(leagueId: string): void`
- `toggleFavoriteTeam(teamId: number): void`

Writes to localStorage immediately on each change.

**Filtering logic:** Before firing any notification, check `prefs.mutedLeagues.includes(event.leagueId)` — skip if muted. Favorite teams get a star prefix in toast/notification text but do not alter which events fire.

---

## Toast System (`hooks/useToasts.ts`, `components/Toast.tsx`, `components/ToastContainer.tsx`)

**`useToasts` hook:**
- Manages a queue of active toasts (max 4 visible)
- `addToast(event: NotificationEvent, isFavorite: boolean): void`
- Each toast auto-dismisses after 5 seconds
- Manual dismiss on click

**`Toast` component:**
- Fixed card showing: league name, score line (`Home 2–1 Away`), event tag (`GOAL`, `KICK OFF`, `HALF TIME`, `FULL TIME`, `POSTPONED`, etc.)
- Scoring team name is bolded on GOAL events
- Favorite teams get a `★` prefix on their name
- Slides in from top-right, fades out on dismiss

**`ToastContainer` component:**
- Fixed overlay, top-right, `z-index` above all content
- Stacks up to 4 toasts with a small gap
- Rendered once in `layout.tsx`

---

## Browser Notification API

Integrated directly in `page.tsx` alongside toast dispatch.

**Permission request:** Called once when the user opens `NotificationSettings` for the first time (not on page load — avoids aggressive permission prompts).

**Firing:** For each filtered event, if `Notification.permission === 'granted'`, fire:
```ts
new Notification(title, { body, icon: '/favicon.ico' })
```
Where `title` is e.g. `"GOAL — Arsenal"` and `body` is `"Arsenal 2–1 Chelsea · Premier League"`.

**Denied state:** If permission is `'denied'`, `NotificationSettings` shows: *"Browser notifications blocked — enable in your browser settings."* No further requests are made.

---

## Notification Settings (`components/NotificationSettings.tsx`)

Accessible via a bell icon (🔔) in `Nav.tsx`. Opens as a modal/panel overlay.

**Contents:**
- Permission status + "Enable browser notifications" button (calls `requestPermission`)
- League toggles — one row per league with on/off toggle, shows league name
- Favorite teams — list of currently favorited teams with remove button; add teams by picking from team names seen in current match data (no extra API calls)

---

## File Structure

```
lib/
  diff-matches.ts           NEW — pure event diffing
  notification-prefs.ts     NEW — localStorage helpers

hooks/
  useNotificationPrefs.ts   NEW — prefs state + updaters
  useToasts.ts              NEW — toast queue state

components/
  Toast.tsx                 NEW — single toast card
  ToastContainer.tsx        NEW — fixed overlay stack
  NotificationSettings.tsx  NEW — settings panel
```

**Existing files modified:**
- `app/layout.tsx` — add `<ToastContainer />`
- `app/page.tsx` — add diff logic + event dispatch on each poll
- `components/Nav.tsx` — add bell icon + settings trigger

---

## Testing

- `lib/diff-matches.ts` — unit tests for all event types (goal, kick off, HT, FT, status changes, no false positives on identical data)
- `lib/notification-prefs.ts` — unit tests for localStorage read/write, defaults
- `hooks/useNotificationPrefs.ts` — hook tests for toggle logic
- `hooks/useToasts.ts` — hook tests for queue, max 4, auto-dismiss, manual dismiss

---

## Future Extension (Supabase)

When adding a backend:
1. Replace `lib/notification-prefs.ts` localStorage calls with Supabase reads/writes
2. Add Web Push subscriptions stored in Supabase
3. Add a server-side polling job that calls `diffMatches` and sends pushes via `web-push`

The `diffMatches` logic and `NotificationEvent` types are reused unchanged.
