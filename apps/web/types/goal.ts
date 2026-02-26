export type GoalType = 'completion_rate' | 'streak_days' | 'total_xp' | 'total_completions'
export type GoalStatus = 'active' | 'completed' | 'failed'

export interface Goal {
  id: number
  type: GoalType
  targetValue: number
  durationDays: number
  startDate: string
  deadline: string
  status: GoalStatus
  xpReward: number
  completedAt: string | null
  createdAt: string
}

export interface GoalWithProgress {
  goal: Goal
  currentValue: number
  progressPercent: number
}

export interface CreateGoalPayload {
  type: GoalType
  targetValue: number
  durationDays: number
}

export interface GoalCompletionResult {
  goal: Goal
  xpEarned: number
  leveledUp: boolean
  newLevel: number
}
