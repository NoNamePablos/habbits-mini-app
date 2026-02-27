export const CHALLENGE_STATUSES = ['active', 'completed', 'failed', 'abandoned'] as const
export type ChallengeStatus = typeof CHALLENGE_STATUSES[number]

export const CHALLENGE_DAY_STATUSES = ['completed', 'missed'] as const
export type ChallengeDayStatus = typeof CHALLENGE_DAY_STATUSES[number]

export const DURATION_PRESETS = [7, 14, 21, 30, 60, 90] as const
export type DurationPreset = typeof DURATION_PRESETS[number]

export const ALLOWED_MISSES_OPTIONS = [0, 1, 2, 3] as const

export const CHALLENGE_ICON_OPTIONS = [
  'Target', 'Swords', 'Trophy', 'Flame', 'Dumbbell',
  'BookOpen', 'Heart', 'Brain', 'Sprout', 'Zap',
  'Shield', 'Flag',
] as const

export type ChallengeIconName = typeof CHALLENGE_ICON_OPTIONS[number]

export interface Challenge {
  id: number
  userId: number
  title: string
  description: string | null
  icon: string
  color: string
  durationDays: number
  allowedMisses: number
  startDate: string
  endDate: string
  status: ChallengeStatus
  completedDays: number
  missedDays: number
  currentStreak: number
  bestStreak: number
  completedAt: string | null
  inviteCode: string | null
  createdAt: string
  updatedAt: string
}

export interface ChallengeParticipant {
  id: number
  challengeId: number
  userId: number
  status: ChallengeStatus
  completedDays: number
  missedDays: number
  currentStreak: number
  bestStreak: number
  completedAt: string | null
  createdAt: string
}

export interface ChallengeDay {
  id: number
  challengeId: number
  userId: number
  dayDate: string
  status: ChallengeDayStatus
  note: string | null
  xpEarned: number
  createdAt: string
}

export interface ChallengeListItem extends Challenge {
  todayCheckedIn: boolean
  isCreator: boolean
  participantStatus: ChallengeStatus | null
}

export interface ChallengesListResponse {
  challenges: ChallengeListItem[]
}

export interface ChallengeDetailResponse {
  challenge: Challenge
  days: ChallengeDay[]
  todayCheckedIn: boolean
  isCreator: boolean
  participant: ChallengeParticipant | null
}

export interface LeaderboardEntry {
  userId: number
  username: string | null
  firstName: string | null
  photoUrl: string | null
  level: number
  completedDays: number
  currentStreak: number
  bestStreak: number
  status: ChallengeStatus
  isCreator: boolean
}

export interface ChallengeInviteResponse {
  inviteCode: string
}

export interface CheckInResponse {
  day: ChallengeDay
  challenge: Challenge
  xpEarned: number
  streakBonusXp: number
  completionBonusXp: number
  leveledUp: boolean
  newLevel: number
  challengeCompleted: boolean
  unlockedAchievements: {
    achievement: { id: number; key: string; name: string; icon: string | null; xpReward: number }
    xpAwarded: number
  }[]
}

export interface CreateChallengePayload {
  title: string
  description?: string
  icon?: string
  color?: string
  durationDays: number
  allowedMisses?: number
  startDate: string
}
