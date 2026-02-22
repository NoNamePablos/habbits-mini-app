import { defineStore } from 'pinia'
import type { UserProfile, AuthResponse } from '~/types/user'
import { DEFAULT_DISPLAY_NAME } from '~/constants'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const isAuthenticated = ref<boolean>(false)
  const isLoading = ref<boolean>(false)

  const displayName = computed<string>(() => {
    const u = toValue(user)
    if (!u) return ''
    return u.firstName || u.username || DEFAULT_DISPLAY_NAME
  })

  const authenticate = async (): Promise<void> => {
    const { initData } = useTelegram()
    if (!toValue(initData)) return

    isLoading.value = true
    const api = useApi()
    const { handleError } = useErrorHandler()
    try {
      const response = await api.post<AuthResponse>('/auth/telegram')
      user.value = response.user
      isAuthenticated.value = true
    } catch (error) {
      handleError(error, 'errors.authFailed')
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    displayName,
    authenticate,
  }
})
