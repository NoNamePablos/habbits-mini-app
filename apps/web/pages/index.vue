<script setup lang="ts">
import type { CreateHabitPayload } from '~/types/habit'
import { Plus, Sparkles } from 'lucide-vue-next'

const authStore = useAuthStore()
const habitsStore = useHabitsStore()
const gamificationStore = useGamificationStore()
const { hapticNotification } = useTelegram()
const { showSuccess, showInfo } = useErrorHandler()

const showCreateForm = ref<boolean>(false)
const showLevelUp = ref<boolean>(false)
const levelUpLevel = ref<number>(1)
const showAchievementPopup = ref<boolean>(false)
const pendingAchievement = ref<{ name: string; icon: string | null; xpReward: number } | null>(null)

onMounted(async () => {
  await habitsStore.fetchHabits()
})

const onToggle = async (habitId: number): Promise<void> => {
  const today = new Date().toISOString().split('T')[0]

  if (habitsStore.isCompleted(habitId)) {
    await habitsStore.uncompleteHabit(habitId, today)
  } else {
    const result = await habitsStore.completeHabit(habitId)
    if (result) {
      hapticNotification('success')

      await gamificationStore.refreshAfterCompletion()

      if (result.freezeUsed) {
        showInfo('streakFreeze.used')
      }
      if (result.freezeEarned) {
        showSuccess('streakFreeze.earned')
      }

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
}

const onHabitClick = (habitId: number): void => {
  navigateTo(`/habits/${habitId}`)
}

const onCreateHabit = async (data: CreateHabitPayload): Promise<void> => {
  const habit = await habitsStore.createHabit(data)
  if (habit) {
    hapticNotification('success')
    showSuccess('success.habitCreated')
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <SharedLoadingSpinner v-if="habitsStore.isLoading" />

    <template v-else>
      <div class="space-y-1 animate-fade-in-up">
        <h1 class="text-2xl font-bold tracking-wide">
          {{ $t('home.greeting', { name: authStore.displayName }) }}
        </h1>
        <p class="text-muted-foreground text-sm">
          {{ $t('home.subtitle') }}
        </p>
      </div>

      <Card class="glass">
        <CardContent class="pt-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">{{ $t('home.dailyProgress') }}</span>
            <span class="text-sm text-muted-foreground">
              {{ habitsStore.completedToday }}/{{ habitsStore.totalToday }}
            </span>
          </div>
          <div class="h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-primary animate-gradient rounded-full transition-all duration-500"
              :style="{ width: `${habitsStore.progressPercent}%` }"
            />
          </div>
        </CardContent>
      </Card>

      <HabitsHabitList
        v-if="habitsStore.groupedByTimeOfDay.length > 0"
        :groups="habitsStore.groupedByTimeOfDay"
        @toggle="onToggle"
        @click="onHabitClick"
      />

      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-center space-y-4"
      >
        <Sparkles class="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 class="text-lg font-semibold">{{ $t('home.emptyTitle') }}</h2>
          <p class="text-sm text-muted-foreground mt-1">
            {{ $t('home.emptyDescription') }}
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

      <HabitsHabitForm
        :open="showCreateForm"
        @update:open="showCreateForm = $event"
        @submit="onCreateHabit"
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
    </template>
  </div>
</template>
