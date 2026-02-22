import type { Component } from 'vue'
import { Sunrise, Sun, Moon, Clock } from 'lucide-vue-next'

export const HABIT_FREQUENCIES = ['daily', 'weekly', 'custom'] as const
export type HabitFrequency = typeof HABIT_FREQUENCIES[number]

export const HABIT_TYPES = ['boolean', 'numeric', 'duration'] as const
export type HabitType = typeof HABIT_TYPES[number]

export const TIMES_OF_DAY = ['morning', 'afternoon', 'evening', 'anytime'] as const
export type TimeOfDay = typeof TIMES_OF_DAY[number]

export const TIME_OF_DAY_ICONS: Record<TimeOfDay, Component> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
  anytime: Clock,
}

export const HABIT_ICON_OPTIONS = [
  'Dumbbell', 'BookOpen', 'PersonStanding', 'Heart',
  'Droplets', 'Target', 'Pencil', 'Music',
  'Sprout', 'BedDouble', 'Apple', 'Brain',
] as const

export type HabitIconName = typeof HABIT_ICON_OPTIONS[number]

export interface Habit {
  id: number
  userId: number
  name: string
  description: string | null
  icon: string | null
  color: string | null
  frequency: HabitFrequency
  targetDays: number[] | null
  type: HabitType
  targetValue: number | null
  currentStreak: number
  bestStreak: number
  sortOrder: number
  timeOfDay: TimeOfDay
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface HabitCompletion {
  id: number
  habitId: number
  userId: number
  completedDate: string
  value: number | null
  xpEarned: number
  note: string | null
  createdAt: string
}

export interface HabitsListResponse {
  habits: Habit[]
  todayCompletions: HabitCompletion[]
}

export interface CompleteResponse {
  completion: HabitCompletion
  habit: Habit
  xpEarned: number
  streakBonusXp: number
  leveledUp: boolean
  newLevel: number
  unlockedAchievements: { achievement: { id: number; key: string; name: string; icon: string | null; xpReward: number }; xpAwarded: number }[]
}

export interface CreateHabitPayload {
  name: string
  description?: string
  icon?: string
  color?: string
  frequency?: HabitFrequency
  targetDays?: number[]
  type?: HabitType
  targetValue?: number
  timeOfDay?: TimeOfDay
}
