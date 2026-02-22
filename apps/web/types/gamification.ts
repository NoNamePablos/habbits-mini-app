export const ACHIEVEMENT_CATEGORIES = ['streak', 'completion', 'social', 'time'] as const
export type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number]

export interface AchievementCriteria {
  type: 'streak' | 'total_completions' | 'habit_count' | 'perfect_day' | 'morning_streak'
  value: number
}

export interface Achievement {
  id: number
  key: string
  name: string
  description: string | null
  icon: string | null
  category: AchievementCategory
  criteria: AchievementCriteria
  xpReward: number
  isHidden: boolean
  unlocked: boolean
  unlockedAt: string | null
}

export interface GamificationProfile {
  xp: number
  level: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  progressPercent: number
}

export interface UnlockedAchievement {
  achievement: Achievement
  xpAwarded: number
}
