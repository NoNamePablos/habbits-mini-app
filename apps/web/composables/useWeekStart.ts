// Week start preference: Mon (true) or Sun (false)
// Source of truth: backend user.settings.weekStartsMonday
// Fast-path cache: localStorage

export const useWeekStart = () => {
  const authStore = useAuthStore()
  const LS_KEY = 'weekStartsMonday'

  const startsMonday = ref<boolean>(() => {
    try {
      const v = localStorage.getItem(LS_KEY)
      return v === null ? true : v === 'true'
    } catch { return true }
  })

  // Sync from backend on auth load
  watch(
    () => authStore.user?.settings?.weekStartsMonday,
    (val) => {
      if (val === undefined || val === null) return
      startsMonday.value = val
      try { localStorage.setItem(LS_KEY, String(val)) } catch { /* noop */ }
    },
    { immediate: true },
  )

  const setStartsMonday = async (value: boolean): Promise<void> => {
    startsMonday.value = value
    try { localStorage.setItem(LS_KEY, String(value)) } catch { /* noop */ }
    await authStore.updateSettings({ weekStartsMonday: value })
  }

  return { startsMonday, setStartsMonday }
}
