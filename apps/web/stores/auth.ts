import { defineStore } from 'pinia'
import type { UserProfile, AuthResponse } from '~/types/user'
import { DEFAULT_DISPLAY_NAME } from '~/constants'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const isAuthenticated = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const dailyLoginXp = ref<number | null>(null)
  const weekLoginDays = ref<string[]>([])

  const { initData } = useTelegram()
  const api = useApi()
  const { handleError } = useErrorHandler()

  const displayName = computed<string>(() => {
    const u = toValue(user)
    if (!u) return DEFAULT_DISPLAY_NAME
    return u.firstName || u.username || DEFAULT_DISPLAY_NAME
  })

  const authenticate = async (): Promise<void> => {
    const raw = toValue(initData)
    if (!raw) return

    isLoading.value = true
    try {
      const response = await api.post<AuthResponse>('/auth/telegram')
      user.value = response.user
      isAuthenticated.value = true
      dailyLoginXp.value = response.dailyLoginXp
      weekLoginDays.value = response.weekLoginDays

      if (response.dailyLoginXp) {
        const gamificationStore = useGamificationStore()
        await gamificationStore.fetchProfile()
      }
    } catch (error) {
      handleError(error, 'errors.authFailed')
    } finally {
      isLoading.value = false
    }
  }

  const clearDailyBonus = (): void => {
    dailyLoginXp.value = null
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    displayName,
    dailyLoginXp,
    weekLoginDays,
    authenticate,
    clearDailyBonus,
  }
})
