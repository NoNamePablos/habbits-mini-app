// Gamification defaults (when profile hasn't loaded yet)
export const GAMIFICATION_DEFAULTS = {
  level: 1,
  xp: 0,
  progressPercent: 0,
  xpForNextLevel: 100,
  xpForCurrentLevel: 0,
} as const

// Habit form defaults & validation
export const HABIT_DEFAULTS = {
  icon: 'Dumbbell',
  timeOfDay: 'anytime',
  frequency: 'daily',
} as const

export const HABIT_VALIDATION = {
  nameMaxLength: 100,
  descriptionMaxLength: 500,
} as const

// Streak badge display threshold
export const STREAK_BADGE_THRESHOLD = 7

// Stats
export const DEFAULT_HEATMAP_MONTHS = 3

// Chart color fallbacks (used when CSS vars can't be resolved)
export const CHART_COLOR_FALLBACKS = {
  primary: '#2481cc',
  muted: '#f0f0f0',
  mutedForeground: '#999999',
} as const

// Heatmap shade opacity levels
export const HEATMAP_SHADE_OPACITIES = [0.2, 0.4, 0.6] as const

// Auth
export const DEFAULT_DISPLAY_NAME = 'User'
