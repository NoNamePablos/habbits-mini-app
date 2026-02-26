export interface DaySummary {
  date: string
  completed: number
  total: number
}

export interface StatsSummary {
  weeklyCompletions: number
  monthlyCompletions: number
  prevWeekCompletions: number
  prevMonthCompletions: number
  weeklyDays: DaySummary[]
  currentActiveHabits: number
  bestStreakOverall: number
}

export interface HeatmapDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface WeeklySummaryData {
  totalCompletions: number
  totalPossible: number
  perfectDays: number
  bestStreak: number
  xpEarned: number
  weeklyDays: DaySummary[]
}

export interface HabitStats {
  totalCompletions: number
  weeklyCompletions: number
  heatmap: HeatmapDay[]
  weeklyData: DaySummary[]
}
