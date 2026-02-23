interface UseOnboardingReturn {
  hasSeenOnboarding: Ref<boolean>
  markAsSeen: () => void
}

export const useOnboarding = (key: string): UseOnboardingReturn => {
  const storageKey = `onboarding_seen_${key}`

  const hasSeenOnboarding = ref<boolean>(false)

  onMounted(() => {
    try {
      hasSeenOnboarding.value = localStorage.getItem(storageKey) === 'true'
    } catch {
      hasSeenOnboarding.value = false
    }
  })

  const markAsSeen = (): void => {
    try {
      localStorage.setItem(storageKey, 'true')
      hasSeenOnboarding.value = true
    } catch {
      // Silently fail if localStorage unavailable
    }
  }

  return { hasSeenOnboarding, markAsSeen }
}
