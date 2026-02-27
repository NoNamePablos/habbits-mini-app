import { useStorage } from '@vueuse/core'

export const useNavBadges = () => {
  const gamificationStore = useGamificationStore()
  const friendsStore = useFriendsStore()
  const lastSeenAchievements = useStorage<number>('lastSeenAchievementsCount', 0)

  const achievementsBadge = computed<number>(() => {
    const current = gamificationStore.unlockedCount
    const seen = toValue(lastSeenAchievements) ?? 0
    return Math.max(0, current - seen)
  })

  const friendRequestsBadge = computed<number>(() => friendsStore.pendingCount)

  const markAchievementsSeen = (): void => {
    lastSeenAchievements.value = gamificationStore.unlockedCount
  }

  return { achievementsBadge, friendRequestsBadge, markAchievementsSeen }
}
