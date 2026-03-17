export const LEVEL_MAX = 10
export const levelThresholds = Array.from({ length: LEVEL_MAX }, (_, i) => i * 1000)

export function getLevelForXP(xp: number): number {
  const safeXP = Number.isFinite(xp) && xp >= 0 ? xp : 0
  let level = 1
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (safeXP >= levelThresholds[i]) {
      level = i + 1
      break
    }
  }
  return Math.min(Math.max(level, 1), LEVEL_MAX)
}

export function getLevelBounds(level: number): { start: number; next: number | null } {
  const safeLevel = Number.isFinite(level) && level > 0 ? level : 1
  const clamped = Math.min(Math.max(safeLevel, 1), LEVEL_MAX)
  const start = levelThresholds[clamped - 1]
  const next = clamped < LEVEL_MAX ? levelThresholds[clamped] : null
  return { start, next }
}

export function getProgressInLevel(xp: number, level: number): number {
  const { start, next } = getLevelBounds(level)
  const safeXP = Number.isFinite(xp) && xp >= 0 ? xp : 0
  if (next === null) return 100
  const denom = next - start || 1
  const raw = ((safeXP - start) / denom) * 100
  return Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0))
}
