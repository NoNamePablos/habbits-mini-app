<script setup lang="ts">
import type { CreateHabitPayload } from '~/types/habit'
import type { DaySummary } from '~/types/stats'
import { Plus, Sparkles, Flame, Check } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const habitsStore = useHabitsStore()
const gamificationStore = useGamificationStore()
const statsStore = useStatsStore()
const { hapticNotification } = useTelegram()
const { showSuccess, showInfo } = useErrorHandler()
const { t } = useI18n()

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const bestCurrentStreak = computed<number>(() => {
  const habits = toValue(habitsStore.habits)
  if (habits.length === 0) return 0
  return Math.max(...habits.map((h) => h.currentStreak))
})

interface WeekDay {
  label: string
  completed: number
  total: number
  isToday: boolean
  isFuture: boolean
}

const weekDays = computed<WeekDay[]>(() => {
  const days = statsStore.summary?.weeklyDays
  if (!days || days.length === 0) return []

  const todayStr = new Date().toISOString().split('T')[0]

  return days.map((d: DaySummary) => {
    const date = new Date(d.date + 'T00:00:00')
    const dayIndex = date.getDay()
    return {
      label: t(`days.${DAY_KEYS[dayIndex]}`),
      completed: d.completed,
      total: d.total,
      isToday: d.date === todayStr,
      isFuture: d.date > todayStr,
    }
  })
})

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365] as const

const showCreateForm = ref<boolean>(false)
const showLevelUp = ref<boolean>(false)
const levelUpLevel = ref<number>(1)
const showStreakMilestone = ref<boolean>(false)
const milestoneStreak = ref<number>(0)
const showAchievementPopup = ref<boolean>(false)
const achievementQueue = ref<Array<{ name: string; icon: string | null; xpReward: number }>>([])
const currentAchievement = computed<{ name: string; icon: string | null; xpReward: number } | null>(() =>
  toValue(achievementQueue).length > 0 ? toValue(achievementQueue)[0] : null,
)

const onAchievementClose = (): void => {
  achievementQueue.value = toValue(achievementQueue).slice(1)
  if (toValue(achievementQueue).length === 0) {
    showAchievementPopup.value = false
  }
}

// Onboarding tour
const { hasSeenOnboarding: hasSeenHomeTour, markAsSeen: markHomeTourSeen } = useOnboarding('homeTour')
const showHomeTour = ref<boolean>(false)
const streakRef = ref<HTMLElement | null>(null)
const weekCirclesRef = ref<HTMLElement | null>(null)
const habitListRef = ref<InstanceType<typeof HTMLElement> | null>(null)
const habitListEl = computed<HTMLElement | null>(() => {
  const r = toValue(habitListRef)
  if (!r) return null
  // Component ref — access $el
  return (r as unknown as { $el?: HTMLElement }).$el ?? (r as HTMLElement)
})

const refreshData = async (): Promise<void> => {
  await Promise.all([
    habitsStore.fetchHabits(),
    gamificationStore.fetchProfile(),
    statsStore.fetchSummary(),
  ])
}

const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({
  onRefresh: refreshData,
})

onMounted(async () => {
  await refreshData()

  await nextTick()
  if (toValue(habitsStore.habits).length > 0 && !toValue(hasSeenHomeTour)) {
    showHomeTour.value = true
  }
})

const onHomeTourClose = (): void => {
  showHomeTour.value = false
  markHomeTourSeen()
}

const onToggle = async (habitId: number): Promise<void> => {
  const today = new Date().toISOString().split('T')[0]

  if (habitsStore.isCompleted(habitId)) {
    const habit = toValue(habitsStore.habits).find((h) => h.id === habitId)
    await habitsStore.uncompleteHabit(habitId, today)
    toast(t('habit.uncompleted'), {
      description: habit?.name,
      action: {
        label: t('habit.undo'),
        onClick: () => habitsStore.completeHabit(habitId),
      },
    })
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
        achievementQueue.value = result.unlockedAchievements.map((a) => ({
          name: a.achievement.name,
          icon: a.achievement.icon,
          xpReward: a.xpAwarded,
        }))
        showAchievementPopup.value = true
      }

      const streak = result.habit.currentStreak
      if (STREAK_MILESTONES.includes(streak as typeof STREAK_MILESTONES[number])) {
        milestoneStreak.value = streak
        showStreakMilestone.value = true
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
  <div ref="containerRef" class="p-4 pb-24 space-y-4">
    <SharedPullToRefreshIndicator
      :pull-distance="pullDistance"
      :is-refreshing="isRefreshing"
    />

    <HabitsHomePageSkeleton v-if="habitsStore.isLoading && !isRefreshing" />

    <template v-else>
      <Card class="glass overflow-hidden">
        <CardContent class="pt-4 pb-4 space-y-4">
          <!-- Streak -->
          <div ref="streakRef" class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
              <Flame class="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <div class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {{ $t('home.streak') }}
              </div>
              <div class="text-2xl font-black leading-tight">
                {{ bestCurrentStreak }}
                <span class="text-sm font-semibold text-muted-foreground">{{ $t('home.streakDays') }}</span>
              </div>
            </div>
          </div>

          <!-- Week circles -->
          <div v-if="weekDays.length > 0" ref="weekCirclesRef" class="flex items-center justify-between">
            <div
              v-for="(day, index) in weekDays"
              :key="index"
              class="flex flex-col items-center gap-1.5"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                :class="[
                  day.isFuture
                    ? 'bg-secondary/30'
                    : day.completed >= day.total && day.total > 0
                      ? 'bg-green-500 text-white'
                      : day.completed > 0
                        ? 'bg-green-500/30 border-2 border-green-500'
                        : 'bg-secondary/30',
                  day.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : '',
                ]"
              >
                <Check
                  v-if="!day.isFuture && day.completed >= day.total && day.total > 0"
                  class="h-4 w-4"
                />
              </div>
              <span
                class="text-[10px] font-medium"
                :class="day.isToday ? 'text-primary' : 'text-muted-foreground'"
              >
                {{ day.label }}
              </span>
            </div>
          </div>

          <!-- Daily progress -->
          <div>
            <div class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              {{ $t('home.dailyProgress') }}
            </div>
            <div class="flex items-baseline gap-1 mb-2">
              <span class="text-2xl font-black leading-tight">
                {{ habitsStore.completedToday }}</span><span class="text-sm text-muted-foreground">/{{ habitsStore.totalToday }}</span>
              <span class="ml-auto text-sm font-semibold text-muted-foreground">
                {{ habitsStore.progressPercent }}%
              </span>
            </div>
            <div class="h-2 bg-foreground/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-primary rounded-full transition-all duration-500"
                :style="{ width: `${habitsStore.progressPercent}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <HabitsHabitList
        v-if="habitsStore.groupedByTimeOfDay.length > 0"
        ref="habitListRef"
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
        <Button
          class="mt-2 bg-gradient-primary border-0 text-white hover:opacity-90"
          @click="showCreateForm = true"
        >
          <Plus class="h-4 w-4 mr-2" />
          {{ $t('home.emptyButton') }}
        </Button>
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
        :achievement="currentAchievement"
        @close="onAchievementClose"
      />

      <GamificationStreakMilestoneOverlay
        :show="showStreakMilestone"
        :streak="milestoneStreak"
        @close="showStreakMilestone = false"
      />

      <HabitsHomeTourOverlay
        :show="showHomeTour"
        :streak-el="streakRef"
        :week-el="weekCirclesRef"
        :habit-list-el="habitListEl"
        @close="onHomeTourClose"
      />
    </template>
  </div>
</template>
