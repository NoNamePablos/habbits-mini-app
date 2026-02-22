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
  primary: '#2481cc',
  muted: '#f0f0f0',
  mutedForeground: '#999999',
} as const

export const HEATMAP_SHADE_OPACITIES = [0.2, 0.4, 0.6] as const

export const DEFAULT_DISPLAY_NAME = 'User'

// Streak freeze limits
export const MAX_STREAK_FREEZES = 3
