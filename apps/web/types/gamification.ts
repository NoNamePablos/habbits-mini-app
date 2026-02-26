export const ACHIEVEMENT_CATEGORIES = ['streak', 'completion', 'social', 'time'] as const
export type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number]

export interface AchievementCriteria {
  type: 'streak' | 'total_completions' | 'habit_count' | 'perfect_day' | 'morning_streak' | 'challenge_created' | 'challenge_completed' | 'challenge_completed_count' | 'challenge_no_misses'
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
  progress: number
  progressMax: number
}

export interface GamificationProfile {
  xp: number
  level: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  progressPercent: number
  streakFreezes: number
}

export interface UnlockedAchievement {
  achievement: Achievement
  xpAwarded: number
}
