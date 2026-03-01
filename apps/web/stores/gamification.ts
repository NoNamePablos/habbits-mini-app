import { defineStore } from 'pinia'
import type { GamificationProfile } from '~/types/gamification'
import { GAMIFICATION_DEFAULTS } from '~/constants'

export const useGamificationStore = defineStore('gamification', () => {
  const api = useApi()
  const { handleError } = useErrorHandler()
  const profile = ref<GamificationProfile | null>(null)

  const level = computed<number>(() => toValue(profile)?.level ?? GAMIFICATION_DEFAULTS.level)
  const xp = computed<number>(() => toValue(profile)?.xp ?? GAMIFICATION_DEFAULTS.xp)
  const progressPercent = computed<number>(() => toValue(profile)?.progressPercent ?? GAMIFICATION_DEFAULTS.progressPercent)
  const xpForNextLevel = computed<number>(() => toValue(profile)?.xpForNextLevel ?? GAMIFICATION_DEFAULTS.xpForNextLevel)
  const xpForCurrentLevel = computed<number>(() => toValue(profile)?.xpForCurrentLevel ?? GAMIFICATION_DEFAULTS.xpForCurrentLevel)
  const streakFreezes = computed<number>(() => toValue(profile)?.streakFreezes ?? 0)

  let pendingFetch: Promise<void> | null = null

  const fetchProfile = async (): Promise<void> => {
    if (pendingFetch) return pendingFetch
    pendingFetch = (async () => {
      try {
        profile.value = await api.get<GamificationProfile>('/gamification/profile')
      } catch (error: unknown) {
        handleError(error, 'errors.fetchProfile')
      } finally {
        pendingFetch = null
      }
    })()
    return pendingFetch
  }

  const refreshAfterCompletion = async (): Promise<void> => {
    await fetchProfile()
  }

  return {
    profile,
    level,
    xp,
    progressPercent,
    xpForNextLevel,
    xpForCurrentLevel,
    streakFreezes,
    fetchProfile,
    refreshAfterCompletion,
  }
})
