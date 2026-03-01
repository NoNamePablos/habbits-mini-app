// Tracks whether a user has seen a specific onboarding screen/tour.
// Source of truth: backend user.settings.seenFlags (cross-device, survives reinstall)
// Fast-path cache: localStorage (avoids flicker on repeated opens)

interface UseOnboardingReturn {
  hasSeenOnboarding: Ref<boolean>
  markAsSeen: () => Promise<void>
}

export const useOnboarding = (key: string): UseOnboardingReturn => {
  const lsKey = `onboarding_seen_${key}`
  const authStore = useAuthStore()

  // Sync fast-path: read localStorage immediately (avoids SSR flash)
  const hasSeenOnboarding = ref<boolean>(() => {
    try { return localStorage.getItem(lsKey) === 'true' } catch { return false }
  })

  // Once auth loads, sync with backend (source of truth)
  watch(
    () => authStore.user?.settings?.seenFlags,
    (flags) => {
      if (!flags) return
      const backendSeen = flags.includes(key)
      if (backendSeen) {
        hasSeenOnboarding.value = true
        // Keep localStorage in sync
        try { localStorage.setItem(lsKey, 'true') } catch { /* noop */ }
      }
    },
    { immediate: true },
  )

  const markAsSeen = async (): Promise<void> => {
    if (hasSeenOnboarding.value) return
    hasSeenOnboarding.value = true
    // Write fast-path cache immediately
    try { localStorage.setItem(lsKey, 'true') } catch { /* noop */ }
    // Persist to backend
    await authStore.updateSettings({ seenFlags: [key] })
  }

  return { hasSeenOnboarding, markAsSeen }
}
