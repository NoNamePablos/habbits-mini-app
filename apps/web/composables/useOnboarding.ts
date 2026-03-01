// Tracks whether a user has seen a specific onboarding screen/tour.
// Source of truth: backend user.settings.seenFlags (cross-device, survives reinstall)
// Fast-path: localStorage key per flag to avoid flicker on repeated opens

interface UseOnboardingReturn {
  hasSeenOnboarding: Ref<boolean>
  markAsSeen: () => Promise<void>
}

export const useOnboarding = (key: string): UseOnboardingReturn => {
  const lsKey = `onboarding_seen_${key}`
  const authStore = useAuthStore()

  const hasSeenOnboarding = ref<boolean>(localStorage.getItem(lsKey) === 'true')

  // Once auth loads, sync with backend (source of truth)
  watch(
    () => authStore.user?.settings?.seenFlags,
    (flags) => {
      if (!flags) return
      if (flags.includes(key)) {
        hasSeenOnboarding.value = true
        localStorage.setItem(lsKey, 'true')
      }
    },
    { immediate: true },
  )

  const markAsSeen = async (): Promise<void> => {
    if (hasSeenOnboarding.value) return
    hasSeenOnboarding.value = true
    localStorage.setItem(lsKey, 'true')
    await authStore.updateSettings({ seenFlags: [key] })
  }

  return { hasSeenOnboarding, markAsSeen }
}
