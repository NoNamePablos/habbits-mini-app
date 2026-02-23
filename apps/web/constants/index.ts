export const GAMIFICATION_DEFAULTS = {
  level: 1,
  xp: 0,
  progressPercent: 0,
  xpForNextLevel: 100,
  xpForCurrentLevel: 0,
} as const

export const HABIT_DEFAULTS = {
  icon: 'Dumbbell',
  timeOfDay: 'anytime',
  frequency: 'daily',
} as const

export const HABIT_VALIDATION = {
  nameMaxLength: 100,
  descriptionMaxLength: 500,
} as const

export const STREAK_BADGE_THRESHOLD = 7

export const DEFAULT_HEATMAP_MONTHS = 3

export const CHART_COLOR_FALLBACKS = {
  primary: '#8774e1',
  muted: '#2d2d2d',
  mutedForeground: '#aaaaaa',
} as const

export const HEATMAP_SHADE_OPACITIES = [0.25, 0.5, 0.75] as const

export const DEFAULT_DISPLAY_NAME = 'User'

// Streak freeze limits
export const MAX_STREAK_FREEZES = 3

// Challenge defaults
export const CHALLENGE_DEFAULTS = {
  icon: 'Target',
  color: '#8774e1',
  allowedMisses: 0,
  durationDays: 30,
} as const

export const CHALLENGE_VALIDATION = {
  titleMaxLength: 100,
  descriptionMaxLength: 500,
  minDuration: 1,
  maxDuration: 365,
} as const
