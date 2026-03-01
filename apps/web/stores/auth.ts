import { defineStore } from 'pinia'
import type { UserProfile, UserSettings, AuthResponse } from '~/types/user'
import { DEFAULT_DISPLAY_NAME } from '~/constants'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const isAuthenticated = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const isNewUser = ref<boolean>(false)
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
      isNewUser.value = response.isNewUser
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

  const updateSettings = async (patch: Partial<UserSettings>): Promise<void> => {
    try {
      const updated = await api.patch<UserProfile>('/users/me/settings', patch)
      if (user.value) {
        user.value = { ...user.value, settings: updated.settings }
      }
    } catch (error) {
      handleError(error, 'errors.saveFailed')
    }
  }

  const clearDailyBonus = (): void => {
    dailyLoginXp.value = null
  }

  const deleteAccount = async (): Promise<boolean> => {
    try {
      await api.del('/users/me')
      user.value = null
      isAuthenticated.value = false
      return true
    } catch (error: unknown) {
      handleError(error, 'errors.deleteAccount')
      return false
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    isNewUser,
    displayName,
    dailyLoginXp,
    weekLoginDays,
    authenticate,
    updateSettings,
    clearDailyBonus,
    deleteAccount,
  }
})
