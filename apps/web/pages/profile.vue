<script setup lang="ts">
import { User, Zap, Flame, Trophy, Calendar, Target, Award, ChevronRight, Snowflake } from 'lucide-vue-next'
import { MAX_STREAK_FREEZES } from '~/constants'

const authStore = useAuthStore()
const gamificationStore = useGamificationStore()
const statsStore = useStatsStore()

const isLoading = ref<boolean>(true)

onMounted(async () => {
  isLoading.value = true
  await Promise.all([
    gamificationStore.fetchProfile(),
    gamificationStore.fetchAchievements(),
    statsStore.fetchSummary(),
    statsStore.fetchHeatmap(),
  ])
  isLoading.value = false
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
          <div class="text-2xl font-bold">{{ statsStore.summary.weeklyCompletions }}</div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Target class="h-3 w-3 text-primary" />
            {{ $t('profile.weekLabel') }}
          </div>
        </CardContent>
      </Card>
      <Card class="glass stagger-item" :style="{ '--stagger': 1 }">
        <CardContent class="pt-4 pb-4 text-center">
          <div class="text-2xl font-bold">{{ statsStore.summary.monthlyCompletions }}</div>
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

    <Card class="glass stagger-item" :style="{ '--stagger': 5 }">
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

    <Card v-if="statsStore.heatmap.length > 0" class="glass stagger-item" :style="{ '--stagger': 6 }">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar class="h-3.5 w-3.5" />
          {{ $t('profile.activity') }}
        </div>
        <StatsCalendarHeatmap :data="statsStore.heatmap" />
      </CardContent>
    </Card>

    <Card v-if="statsStore.summary && statsStore.summary.weeklyDays.length > 0" class="glass stagger-item" :style="{ '--stagger': 7 }">
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
