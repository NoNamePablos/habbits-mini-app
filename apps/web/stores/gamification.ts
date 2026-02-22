import { defineStore } from 'pinia'
import type { GamificationProfile, Achievement } from '~/types/gamification'
import { GAMIFICATION_DEFAULTS } from '~/constants'

export const useGamificationStore = defineStore('gamification', () => {
  const api = useApi()
  const { handleError } = useErrorHandler()
  const profile = ref<GamificationProfile | null>(null)
  const achievements = ref<Achievement[]>([])
  const isLoading = ref<boolean>(false)

  const level = computed<number>(() => toValue(profile)?.level ?? GAMIFICATION_DEFAULTS.level)
  const xp = computed<number>(() => toValue(profile)?.xp ?? GAMIFICATION_DEFAULTS.xp)
  const progressPercent = computed<number>(() => toValue(profile)?.progressPercent ?? GAMIFICATION_DEFAULTS.progressPercent)
  const xpForNextLevel = computed<number>(() => toValue(profile)?.xpForNextLevel ?? GAMIFICATION_DEFAULTS.xpForNextLevel)
  const xpForCurrentLevel = computed<number>(() => toValue(profile)?.xpForCurrentLevel ?? GAMIFICATION_DEFAULTS.xpForCurrentLevel)
  const streakFreezes = computed<number>(() => toValue(profile)?.streakFreezes ?? 0)

  const unlockedCount = computed<number>(() =>
    toValue(achievements).filter((a) => a.unlocked).length,
  )

  const totalCount = computed<number>(() =>
    toValue(achievements).filter((a) => !a.isHidden || a.unlocked).length,
  )

  const fetchProfile = async (): Promise<void> => {
    try {
      profile.value = await api.get<GamificationProfile>('/gamification/profile')
    } catch (error) {
      handleError(error, 'errors.fetchProfile')
    }
  }

  const fetchAchievements = async (): Promise<void> => {
    isLoading.value = true
    try {
      achievements.value = await api.get<Achievement[]>('/achievements')
    } catch (error) {
      handleError(error, 'errors.fetchAchievements')
    } finally {
      isLoading.value = false
    }
  }

  const refreshAfterCompletion = async (): Promise<void> => {
    await fetchProfile()
  }

  return {
    profile,
    achievements,
    isLoading,
    level,
    xp,
    progressPercent,
    xpForNextLevel,
    xpForCurrentLevel,
    streakFreezes,
    unlockedCount,
    totalCount,
    fetchProfile,
    fetchAchievements,
    refreshAfterCompletion,
  }
})
