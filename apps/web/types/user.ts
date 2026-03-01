export interface UserSettings {
  seenFlags?: string[]
  weekStartsMonday?: boolean
  focusMode?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

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
  settings: UserSettings | null
}

export interface AuthResponse {
  user: UserProfile
  message: string
  isNewUser: boolean
  dailyLoginXp: number | null
  weekLoginDays: string[]
}
