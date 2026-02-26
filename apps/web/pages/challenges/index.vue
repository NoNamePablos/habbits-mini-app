<script setup lang="ts">
import type { CreateChallengePayload } from '~/types/challenge'
import { Plus, Target } from 'lucide-vue-next'

const challengesStore = useChallengesStore()
const gamificationStore = useGamificationStore()
const { hapticNotification } = useTelegram()
const { showSuccess } = useErrorHandler()

const showCreateForm = ref<boolean>(false)
const showLevelUp = ref<boolean>(false)
const levelUpLevel = ref<number>(1)
const showAchievementPopup = ref<boolean>(false)
const pendingAchievement = ref<{ name: string; icon: string | null; xpReward: number } | null>(null)

const { hasSeenOnboarding, markAsSeen } = useOnboarding('challenges')
const showOnboarding = ref<boolean>(false)

onMounted(async () => {
  await challengesStore.fetchChallenges()

  if (!toValue(hasSeenOnboarding)) {
    await nextTick()
    showOnboarding.value = true
  }
})

const onOnboardingClose = (dontShowAgain: boolean): void => {
  showOnboarding.value = false
  if (dontShowAgain) {
    markAsSeen()
  }
}

const onChallengeClick = (id: number): void => {
  navigateTo(`/challenges/${id}`)
}

const onCheckIn = async (id: number): Promise<void> => {
  const result = await challengesStore.checkIn(id)
  if (result) {
    hapticNotification('success')
    showSuccess('success.challengeCheckedIn')
    await gamificationStore.refreshAfterCompletion()

    if (result.leveledUp) {
      levelUpLevel.value = result.newLevel
      showLevelUp.value = true
    }
    if (result.unlockedAchievements.length > 0) {
      const first = result.unlockedAchievements[0]
      pendingAchievement.value = {
        name: first.achievement.name,
        icon: first.achievement.icon,
        xpReward: first.xpAwarded,
      }
      showAchievementPopup.value = true
    }
  }
}

const onCreateChallenge = async (data: CreateChallengePayload): Promise<void> => {
  const challenge = await challengesStore.createChallenge(data)
  if (challenge) {
    hapticNotification('success')
    showSuccess('success.challengeCreated')
    await gamificationStore.refreshAfterCompletion()
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <ChallengesPageSkeleton v-if="challengesStore.isLoading" />

    <template v-else>
      <div class="space-y-1 animate-fade-in-up">
        <h1 class="text-2xl font-bold tracking-wide">{{ $t('challenges.title') }}</h1>
        <ChallengesStatsBar
          :active="challengesStore.activeChallenges.length"
          :completed="challengesStore.challenges.filter(c => c.status === 'completed').length"
          :total="challengesStore.challenges.length"
        />
      </div>

      <template v-if="challengesStore.activeChallenges.length > 0 || challengesStore.historyChallenges.length > 0">
        <div v-if="challengesStore.activeChallenges.length > 0" class="space-y-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {{ $t('challenges.active') }}
          </h2>
          <ChallengesChallengeCard
            v-for="(challenge, index) in challengesStore.activeChallenges"
            :key="challenge.id"
            :challenge="challenge"
            class="stagger-item"
            :style="{ '--stagger': index }"
            @click="onChallengeClick"
            @check-in="onCheckIn"
          />
        </div>

        <div v-if="challengesStore.historyChallenges.length > 0" class="space-y-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {{ $t('challenges.history') }}
          </h2>
          <ChallengesChallengeCard
            v-for="(challenge, index) in challengesStore.historyChallenges"
            :key="challenge.id"
            :challenge="challenge"
            compact
            class="stagger-item"
            :style="{ '--stagger': index }"
            @click="onChallengeClick"
          />
        </div>
      </template>

      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-center space-y-4"
      >
        <Target class="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 class="text-lg font-semibold">{{ $t('challenges.emptyTitle') }}</h2>
          <p class="text-sm text-muted-foreground mt-1">
            {{ $t('challenges.emptyDescription') }}
          </p>
        </div>
      </div>

      <Button
        size="icon"
        class="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-gradient-primary border border-white/20 text-white hover:opacity-90"
        @click="showCreateForm = true"
      >
        <Plus class="h-6 w-6" />
      </Button>

      <ChallengesChallengeForm
        :open="showCreateForm"
        @update:open="showCreateForm = $event"
        @submit="onCreateChallenge"
      />

      <GamificationLevelUpOverlay
        :show="showLevelUp"
        :level="levelUpLevel"
        @close="showLevelUp = false"
      />

      <GamificationAchievementPopup
        :show="showAchievementPopup"
        :achievement="pendingAchievement"
        @close="showAchievementPopup = false"
      />

      <ChallengesOnboardingOverlay
        :show="showOnboarding"
        @close="onOnboardingClose"
      />
    </template>
  </div>
</template>
