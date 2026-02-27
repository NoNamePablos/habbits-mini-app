<script setup lang="ts">
import { User, Zap, Flame, Trophy, Calendar, Target, Award, ChevronRight, Snowflake, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-vue-next'
import { MAX_STREAK_FREEZES } from '~/constants'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const authStore = useAuthStore()
const gamificationStore = useGamificationStore()
const statsStore = useStatsStore()
const habitsStore = useHabitsStore()
const goalsStore = useGoalsStore()
const { t, locale } = useI18n()

const isLoading = ref<boolean>(true)

onMounted(async () => {
  isLoading.value = true
  await Promise.all([
    gamificationStore.fetchProfile(),
    gamificationStore.fetchAchievements(),
    statsStore.fetchSummary(),
    statsStore.fetchHeatmap(),
    goalsStore.fetchHistory(),
    habitsStore.fetchHabits(),
  ])
  isLoading.value = false
})

const insights = computed<string[]>(() => {
  const result: string[] = []
  const summary = statsStore.summary
  const habits = toValue(habitsStore.habits)

  if (!summary) return result

  const days = summary.weeklyDays
  if (days && days.length > 0) {
    const best = days.reduce((a, b) => {
      const rateA = a.total > 0 ? a.completed / a.total : 0
      const rateB = b.total > 0 ? b.completed / b.total : 0
      return rateB > rateA ? b : a
    })
    if (best.total > 0 && best.completed > 0) {
      const dayName = t(`days.${DAY_KEYS[new Date(best.date + 'T00:00:00').getDay()]}`)
      result.push(t('profile.insightBestDay', { day: dayName }))
    }
  }

  if (habits.length > 0) {
    const best = habits.reduce((a, b) => b.currentStreak > a.currentStreak ? b : a)
    if (best.currentStreak >= 7) {
      result.push(t('profile.insightBestStreak', { name: best.name, streak: best.currentStreak }))
    }
  }

  if (summary.weeklyCompletions > 0 && habits.length > 0) {
    const possible = habits.length * 7
    const pct = Math.round((summary.weeklyCompletions / possible) * 100)
    if (pct > 0) {
      result.push(t('profile.insightWeeklyRate', { pct }))
    }
  }

  return result
})

const habitScore = computed<number>(() => {
  const habits = toValue(habitsStore.habits)
  const summary = statsStore.summary
  if (!habits.length || !summary) return 0
  const completionRate = Math.min(100, (summary.weeklyCompletions / (habits.length * 7)) * 100)
  const bestStreak = Math.max(...habits.map((h) => h.currentStreak))
  const streakHealth = Math.min(100, (bestStreak / 30) * 100)
  return Math.round(completionRate * 0.5 + streakHealth * 0.5)
})

const habitScoreLabel = computed<string>(() => {
  const s = toValue(habitScore)
  if (s >= 81) return t('profile.scoreElite')
  if (s >= 61) return t('profile.scoreStrong')
  if (s >= 41) return t('profile.scoreSolid')
  if (s >= 21) return t('profile.scoreDeveloping')
  return t('profile.scoreBeginner')
})

const habitScoreColor = computed<string>(() => {
  const s = toValue(habitScore)
  if (s >= 81) return 'text-teal-400'
  if (s >= 61) return 'text-green-400'
  if (s >= 41) return 'text-yellow-400'
  if (s >= 21) return 'text-orange-400'
  return 'text-red-400'
})

interface HabitRecord {
  label: string
  value: string | number
  icon: string
}

const personalRecords = computed<HabitRecord[]>(() => {
  const habits = toValue(habitsStore.habits)
  const summary = statsStore.summary
  const records: HabitRecord[] = []
  if (!habits.length) return records

  const bestStreakHabit = habits.reduce((a, b) => b.bestStreak > a.bestStreak ? b : a)
  if (bestStreakHabit.bestStreak > 0) {
    records.push({ label: t('profile.recordBestStreak'), value: `${bestStreakHabit.bestStreak}d — ${bestStreakHabit.name}`, icon: '🔥' })
  }
  if (summary && summary.bestStreakOverall > 0) {
    records.push({ label: t('profile.recordOverallStreak'), value: `${summary.bestStreakOverall} ${t('home.streakDays')}`, icon: '🏆' })
  }
  if (summary && summary.weeklyCompletions > 0) {
    records.push({ label: t('profile.recordWeekly'), value: summary.weeklyCompletions, icon: '⚡' })
  }
  return records
})

type TrendDirection = 'up' | 'down' | 'neutral'

const weeklyTrend = computed<TrendDirection>(() => {
  const s = statsStore.summary
  if (!s) return 'neutral'
  if (s.weeklyCompletions > s.prevWeekCompletions) return 'up'
  if (s.weeklyCompletions < s.prevWeekCompletions) return 'down'
  return 'neutral'
})

const monthlyTrend = computed<TrendDirection>(() => {
  const s = statsStore.summary
  if (!s) return 'neutral'
  if (s.monthlyCompletions > s.prevMonthCompletions) return 'up'
  if (s.monthlyCompletions < s.prevMonthCompletions) return 'down'
  return 'neutral'
})

const topHabits = computed(() =>
  [...toValue(habitsStore.habits)]
    .filter((h) => h.currentStreak > 0)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 3),
)

const strugglingHabits = computed(() =>
  toValue(habitsStore.habits)
    .filter((h) => h.isActive && h.currentStreak === 0)
    .slice(0, 3),
)

const goalsHistoryByMonth = computed(() => {
  const goals = toValue(goalsStore.history).filter((g) => g.status !== 'active')
  const groups: Record<string, typeof goals> = {}
  for (const goal of goals) {
    const dateStr = goal.completedAt ?? goal.deadline
    const key = dateStr.slice(0, 7)
    if (!groups[key]) groups[key] = []
    groups[key].push(goal)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3)
    .map(([month, items]) => {
      const [year, mon] = month.split('-')
      const label = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(Number(year), Number(mon) - 1))
      return { month, label, items }
    })
})
</script>

<template>
  <div class="p-4 space-y-4">
    <SharedProfilePageSkeleton v-if="isLoading" />

    <template v-else>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ $t('profile.title') }}</h1>
    </div>

    <Card v-if="authStore.user" class="glass animate-fade-in-up">
      <CardContent class="pt-6 pb-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full glass bg-primary/10 flex items-center justify-center">
            <User class="h-7 w-7 text-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="font-semibold text-lg truncate">{{ authStore.displayName }}</h2>
            <div class="flex items-center gap-1 text-sm text-muted-foreground">
              <Zap class="h-3.5 w-3.5 text-primary" />
              {{ $t('profile.level', { level: gamificationStore.level }) }}
            </div>
          </div>
        </div>

        <div class="mt-4">
          <div class="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{{ gamificationStore.xp }} XP</span>
            <span>{{ gamificationStore.xpForNextLevel }} XP</span>
          </div>
          <div class="h-2 bg-foreground/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-primary animate-gradient rounded-full transition-all duration-500"
              :style="{ width: `${gamificationStore.progressPercent}%` }"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <div v-if="statsStore.summary" class="grid grid-cols-2 gap-3">
      <Card class="glass stagger-item" :style="{ '--stagger': 0 }">
        <CardContent class="pt-4 pb-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <span class="text-2xl font-bold">{{ statsStore.summary.weeklyCompletions }}</span>
            <TrendingUp v-if="weeklyTrend === 'up'" class="h-4 w-4 text-green-500 shrink-0" />
            <TrendingDown v-else-if="weeklyTrend === 'down'" class="h-4 w-4 text-red-400 shrink-0" />
          </div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Target class="h-3 w-3 text-primary" />
            {{ $t('profile.weekLabel') }}
          </div>
        </CardContent>
      </Card>
      <Card class="glass stagger-item" :style="{ '--stagger': 1 }">
        <CardContent class="pt-4 pb-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <span class="text-2xl font-bold">{{ statsStore.summary.monthlyCompletions }}</span>
            <TrendingUp v-if="monthlyTrend === 'up'" class="h-4 w-4 text-green-500 shrink-0" />
            <TrendingDown v-else-if="monthlyTrend === 'down'" class="h-4 w-4 text-red-400 shrink-0" />
          </div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar class="h-3 w-3 text-primary" />
            {{ $t('profile.monthLabel') }}
          </div>
        </CardContent>
      </Card>
      <Card class="glass stagger-item" :style="{ '--stagger': 2 }">
        <CardContent class="pt-4 pb-4 text-center">
          <div class="text-2xl font-bold">{{ statsStore.summary.bestStreakOverall }}</div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Flame class="h-3 w-3 text-orange-500 icon-glow" />
            {{ $t('profile.bestStreak') }}
          </div>
        </CardContent>
      </Card>
      <Card class="glass stagger-item" :style="{ '--stagger': 3 }">
        <CardContent class="pt-4 pb-4 text-center">
          <div class="text-2xl font-bold">{{ statsStore.summary.currentActiveHabits }}</div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Target class="h-3 w-3 text-muted-foreground" />
            {{ $t('profile.activeHabits') }}
          </div>
        </CardContent>
      </Card>
    </div>

    <StatsInsightCard v-if="insights.length > 0" :insights="insights" />

    <!-- Habit Score -->
    <Card class="glass animate-fade-in-up">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              {{ $t('profile.habitScore') }}
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-black" :class="habitScoreColor">{{ habitScore }}</span>
              <span class="text-sm font-semibold" :class="habitScoreColor">{{ habitScoreLabel }}</span>
            </div>
          </div>
          <div class="w-16 h-16">
            <ChallengesChallengeProgress :percent="habitScore" :size="64" :stroke-width="6" color="hsl(var(--primary))">
              <span class="text-[10px] font-bold">{{ habitScore }}%</span>
            </ChallengesChallengeProgress>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Personal Records -->
    <Card v-if="personalRecords.length > 0" class="glass animate-fade-in-up">
      <CardContent class="pt-4 pb-4 space-y-2">
        <div class="flex items-center gap-2 mb-3">
          <Trophy class="h-4 w-4 text-yellow-500" />
          <span class="text-sm font-semibold">{{ $t('profile.personalRecords') }}</span>
        </div>
        <div v-for="record in personalRecords" :key="record.label" class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">{{ record.icon }} {{ record.label }}</span>
          <span class="text-xs font-semibold">{{ record.value }}</span>
        </div>
      </CardContent>
    </Card>

    <!-- Habit Ranking -->
    <Card v-if="topHabits.length > 0 || strugglingHabits.length > 0" class="glass animate-fade-in-up">
      <CardContent class="pt-4 pb-4 space-y-3">
        <div v-if="topHabits.length > 0">
          <div class="flex items-center gap-2 mb-2">
            <TrendingUp class="h-4 w-4 text-green-500" />
            <span class="text-xs font-semibold text-green-500">{{ $t('profile.topHabits') }}</span>
          </div>
          <div v-for="habit in topHabits" :key="habit.id" class="flex items-center justify-between py-1">
            <span class="text-xs truncate flex-1">{{ habit.name }}</span>
            <span class="text-xs font-semibold text-orange-500 shrink-0 ml-2">🔥 {{ habit.currentStreak }}</span>
          </div>
        </div>
        <Separator v-if="topHabits.length > 0 && strugglingHabits.length > 0" />
        <div v-if="strugglingHabits.length > 0">
          <div class="flex items-center gap-2 mb-2">
            <TrendingDown class="h-4 w-4 text-red-400" />
            <span class="text-xs font-semibold text-red-400">{{ $t('profile.needAttention') }}</span>
          </div>
          <div v-for="habit in strugglingHabits" :key="habit.id" class="flex items-center justify-between py-1">
            <span class="text-xs truncate flex-1 text-muted-foreground">{{ habit.name }}</span>
            <span class="text-xs text-muted-foreground shrink-0 ml-2">{{ $t('profile.noStreak') }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="glass stagger-item" :style="{ '--stagger': 4 }">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Snowflake class="h-4 w-4 text-blue-500" />
            <span class="text-sm font-medium">{{ $t('profile.streakFreezes') }}</span>
          </div>
          <Badge variant="secondary" class="text-xs">
            {{ gamificationStore.streakFreezes }}/{{ MAX_STREAK_FREEZES }}
          </Badge>
        </div>
      </CardContent>
    </Card>

    <Card v-if="goalsStore.history.length > 0" class="glass stagger-item" :style="{ '--stagger': 5 }">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Target class="h-4 w-4 text-primary" />
            <span class="text-sm font-semibold">{{ $t('goals.history') }}</span>
          </div>
          <Badge variant="secondary" class="text-xs">
            {{ $t('goals.historyCount', { count: goalsStore.completedCount }) }}
          </Badge>
        </div>
        <div class="space-y-3">
          <div v-for="group in goalsHistoryByMonth" :key="group.month">
            <div class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              {{ group.label }}
            </div>
            <div class="space-y-1.5">
              <div
                v-for="goal in group.items"
                :key="goal.id"
                class="flex items-center gap-2"
              >
                <CheckCircle v-if="goal.status === 'completed'" class="h-3.5 w-3.5 text-green-500 shrink-0" />
                <XCircle v-else class="h-3.5 w-3.5 text-red-400 shrink-0" />
                <span class="text-xs flex-1 truncate">
                  {{ $t(`goals.typeDescription.${goal.type}`, { target: goal.targetValue }) }}
                </span>
                <span class="text-[10px] text-muted-foreground shrink-0">
                  {{ goal.status === 'completed' ? $t('profile.goalCompleted') : $t('profile.goalFailed') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="glass stagger-item" :style="{ '--stagger': 6 }">
      <CardContent class="pt-4 pb-4">
        <NuxtLink to="/achievements" class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Award class="h-4 w-4 text-yellow-500 icon-glow" />
            <span class="text-sm font-medium">{{ $t('profile.achievements') }}</span>
          </div>
          <div class="flex items-center gap-1">
            <Badge variant="secondary" class="text-xs">
              {{ gamificationStore.unlockedCount }}/{{ gamificationStore.totalCount }}
            </Badge>
            <ChevronRight class="h-4 w-4 text-muted-foreground" />
          </div>
        </NuxtLink>
      </CardContent>
    </Card>

    <Card v-if="statsStore.heatmap.length > 0" class="glass stagger-item" :style="{ '--stagger': 7 }">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar class="h-3.5 w-3.5" />
          {{ $t('profile.activity') }}
        </div>
        <StatsCalendarHeatmap :data="statsStore.heatmap" />
        <p class="text-[10px] text-muted-foreground/60 mt-2 text-right">
          {{ $t('profile.heatmapHint') }}
        </p>
      </CardContent>
    </Card>

    <Card v-if="statsStore.summary && statsStore.summary.weeklyDays.length > 0" class="glass stagger-item" :style="{ '--stagger': 8 }">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Trophy class="h-3.5 w-3.5" />
          {{ $t('profile.weeklyProgress') }}
        </div>
        <StatsWeeklyChart :data="statsStore.summary.weeklyDays" />
      </CardContent>
    </Card>
    </template>
  </div>
</template>
