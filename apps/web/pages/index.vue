<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { CreateHabitPayload, TimeOfDay } from '~/types/habit'
import type { CreateGoalPayload, Goal } from '~/types/goal'
import type { DaySummary } from '~/types/stats'
import { Plus, Sparkles } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const habitsStore = useHabitsStore()
const gamificationStore = useGamificationStore()
const statsStore = useStatsStore()
const goalsStore = useGoalsStore()
const { hapticNotification } = useTelegram()
const { showSuccess, showInfo } = useErrorHandler()
const { t } = useI18n()
const { startsMonday } = useWeekStart()

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const bestCurrentStreak = computed<number>(() => {
  const habits = toValue(habitsStore.habits)
  if (habits.length === 0) return 0
  return Math.max(...habits.map((h) => h.currentStreak))
})

const progressLabel = computed<string>(() => {
  const pct = habitsStore.progressPercent
  const remaining = habitsStore.totalToday - habitsStore.completedToday
  if (habitsStore.totalToday === 0) return ''
  if (pct === 0) return t('home.progressLabel.start')
  if (pct < 25) return t('home.progressLabel.early')
  if (pct < 75) return t('home.progressLabel.midway')
  if (pct < 100) return t('home.progressLabel.almost', { count: remaining })
  return t('home.progressLabel.perfect')
})

interface WeekDay extends DaySummary {
  label: string
  isToday: boolean
  isFuture: boolean
}

const weekDays = computed<WeekDay[]>(() => {
  const days = statsStore.summary?.weeklyDays
  if (!days || days.length === 0) return []

  const todayStr = new Date().toISOString().split('T')[0]

  let orderedDays = [...days]
  if (toValue(startsMonday)) {
    orderedDays = orderedDays.sort((a, b) => {
      const dayA = new Date(a.date + 'T00:00:00').getDay()
      const dayB = new Date(b.date + 'T00:00:00').getDay()
      return (dayA === 0 ? 7 : dayA) - (dayB === 0 ? 7 : dayB)
    })
  } else {
    orderedDays = orderedDays.sort((a, b) => {
      const dayA = new Date(a.date + 'T00:00:00').getDay()
      const dayB = new Date(b.date + 'T00:00:00').getDay()
      return dayA - dayB
    })
  }

  return orderedDays.map((d: DaySummary) => {
    const date = new Date(d.date + 'T00:00:00')
    const dayIndex = date.getDay()
    return {
      ...d,
      label: t(`days.${DAY_KEYS[dayIndex]}`),
      isToday: d.date === todayStr,
      isFuture: d.date > todayStr,
    }
  })
})

// Habit filter
const habitFilter = ref<TimeOfDay | 'all'>('all')

const filteredGroups = computed(() => {
  const groups = habitsStore.groupedByTimeOfDay
  if (toValue(habitFilter) === 'all') return groups
  return groups.filter((g) => g.key === toValue(habitFilter))
})

const filteredCount = computed<number>(() =>
  toValue(filteredGroups).reduce((sum: number, g) => sum + g.habits.length, 0),
)

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365] as const

const showCreateForm = ref<boolean>(false)
const showGoalForm = ref<boolean>(false)
const showGoalCompleted = ref<boolean>(false)
const goalCompletedData = ref<{ goal: Goal; xpEarned: number } | null>(null)
const showLevelUp = ref<boolean>(false)
const levelUpLevel = ref<number>(1)
const showStreakMilestone = ref<boolean>(false)
const milestoneStreak = ref<number>(0)
const showAchievementPopup = ref<boolean>(false)
const achievementQueue = ref<Array<{ name: string; icon: string | null; xpReward: number }>>([])
const currentAchievement = computed<{ name: string; icon: string | null; xpReward: number } | null>(() =>
  toValue(achievementQueue).length > 0 ? toValue(achievementQueue)[0] : null,
)

const showPerfectDay = ref<boolean>(false)
const perfectDayDate = useStorage<string>('perfectDayDate', '')
const alreadyShownToday = computed<boolean>(() => {
  const today = new Date().toISOString().split('T')[0]
  return toValue(perfectDayDate) === today
})

const onAchievementClose = (): void => {
  achievementQueue.value = toValue(achievementQueue).slice(1)
  if (toValue(achievementQueue).length === 0) {
    showAchievementPopup.value = false
  }
}

// Onboarding tour
const { hasSeenOnboarding: hasSeenHomeTour, markAsSeen: markHomeTourSeen } = useOnboarding('homeTour')
const showHomeTour = ref<boolean>(false)
const habitListRef = ref<InstanceType<typeof HTMLElement> | null>(null)
const habitListEl = computed<HTMLElement | null>(() => {
  const r = toValue(habitListRef)
  if (!r) return null
  return (r as unknown as { $el?: HTMLElement }).$el ?? (r as HTMLElement)
})

const refreshData = async (): Promise<void> => {
  await Promise.all([
    habitsStore.fetchHabits(),
    gamificationStore.fetchProfile(),
    statsStore.fetchSummary(),
    goalsStore.fetchActiveGoal(),
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

      if (result.goalCompleted) {
        goalCompletedData.value = {
          goal: result.goalCompleted.goal,
          xpEarned: result.goalCompleted.xpEarned,
        }
        showGoalCompleted.value = true
        await goalsStore.fetchActiveGoal()
      }

      if (habitsStore.progressPercent === 100 && habitsStore.totalToday > 0 && !toValue(alreadyShownToday)) {
        showPerfectDay.value = true
        perfectDayDate.value = new Date().toISOString().split('T')[0]
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

const onCreateGoal = async (data: CreateGoalPayload): Promise<void> => {
  const goal = await goalsStore.createGoal(data)
  if (goal) {
    hapticNotification('success')
    showSuccess('success.goalCreated')
  }
}

const onAbandonGoal = async (goalId: number): Promise<void> => {
  await goalsStore.abandonGoal(goalId)
}

const onGoalCompletedClose = (): void => {
  showGoalCompleted.value = false
  goalCompletedData.value = null
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
      <!-- Block 1: Today's Progress -->
      <HomeTodayProgress
        :completed="habitsStore.completedToday"
        :total="habitsStore.totalToday"
        :percent="habitsStore.progressPercent"
        :streak="bestCurrentStreak"
        :progress-label="progressLabel"
      />

      <!-- Block 2: This Week -->
      <HomeThisWeek
        v-if="weekDays.length > 0"
        :days="weekDays"
      />

      <!-- Goal card -->
      <GoalsGoalCard
        :active-goal="goalsStore.activeGoal"
        @create="showGoalForm = true"
        @abandon="onAbandonGoal"
      />

      <!-- Block 3: My Habits -->
      <div v-if="habitsStore.groupedByTimeOfDay.length > 0">
        <HomeHabitsSectionHeader
          :count="filteredCount"
          :filter="habitFilter"
          @update:filter="habitFilter = $event"
        />

        <HabitsHabitList
          v-if="filteredGroups.length > 0"
          ref="habitListRef"
          :groups="filteredGroups"
          @toggle="onToggle"
          @click="onHabitClick"
        />

        <div
          v-else
          class="flex flex-col items-center justify-center py-8 text-center space-y-2"
        >
          <p class="text-sm text-muted-foreground">{{ $t('home.filterEmpty') }}</p>
        </div>
      </div>

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

      <GamificationPerfectDayOverlay
        :show="showPerfectDay"
        @close="showPerfectDay = false"
      />

      <GoalsGoalForm
        :open="showGoalForm"
        @update:open="showGoalForm = $event"
        @submit="onCreateGoal"
      />

      <GoalsGoalCompletedOverlay
        :show="showGoalCompleted"
        :goal="goalCompletedData?.goal ?? null"
        :xp-earned="goalCompletedData?.xpEarned ?? 0"
        @close="onGoalCompletedClose"
      />

      <HabitsHomeTourOverlay
        :show="showHomeTour"
        :streak-el="null"
        :week-el="null"
        :habit-list-el="habitListEl"
        @close="onHomeTourClose"
      />
    </template>
  </div>
</template>
