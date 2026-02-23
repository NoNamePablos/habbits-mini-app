export interface UserProfile {
  id: number
  telegramId: number
  username: string | null
  firstName: string | null
  lastName: string | null
  photoUrl: string | null
  xp: number
  level: number
  streakFreezes: number
  timezone: string
}

export interface AuthResponse {
  user: UserProfile
  message: string
  dailyLoginXp: number | null
  weekLoginDays: string[]
}
