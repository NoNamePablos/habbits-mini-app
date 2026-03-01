import type { TimeOfDay } from '~/types/habit'

export const useFocusMode = () => {
  const authStore = useAuthStore()
  const LS_KEY = 'focusMode'

  const focusMode = ref<boolean>(() => {
    try { return localStorage.getItem(LS_KEY) === 'true' } catch { return false }
  })

  // Sync from backend on auth load
  watch(
    () => authStore.user?.settings?.focusMode,
    (val) => {
      if (val === undefined || val === null) return
      focusMode.value = val
      try { localStorage.setItem(LS_KEY, String(val)) } catch { /* noop */ }
    },
    { immediate: true },
  )

  const setFocusMode = async (value: boolean): Promise<void> => {
    focusMode.value = value
    try { localStorage.setItem(LS_KEY, String(value)) } catch { /* noop */ }
    await authStore.updateSettings({ focusMode: value })
  }

  const currentTimeOfDay = computed<TimeOfDay>(() => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    return 'evening'
  })

  return { focusMode, setFocusMode, currentTimeOfDay }
}
