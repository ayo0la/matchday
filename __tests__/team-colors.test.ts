import { getKitColor } from '@/lib/team-colors'

describe('getKitColor', () => {
  it('returns home color for Barcelona home', () => {
    expect(getKitColor(81, true)).toBe('#004D98')
  })

  it('returns away color for Barcelona away', () => {
    expect(getKitColor(81, false)).toBe('#A50044')
  })

  it('returns fallback for unknown team', () => {
    expect(getKitColor(99999, true)).toBe('#ffffff20')
  })

  it('returns fallback for unknown team away', () => {
    expect(getKitColor(99999, false)).toBe('#ffffff20')
  })
})
