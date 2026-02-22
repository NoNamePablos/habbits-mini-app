<script setup lang="ts">
import { User, Zap, Flame, Trophy, Calendar, Target, Award, ChevronRight } from 'lucide-vue-next'

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
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ $t('profile.title') }}</h1>
      <SharedLanguageSwitcher />
    </div>

    <Card v-if="authStore.user">
      <CardContent class="pt-6 pb-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
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
          <Progress :model-value="gamificationStore.progressPercent" class="h-2" />
        </div>
      </CardContent>
    </Card>

    <div v-if="statsStore.summary" class="grid grid-cols-2 gap-3">
      <Card>
        <CardContent class="pt-4 pb-4 text-center">
          <div class="text-2xl font-bold">{{ statsStore.summary.weeklyCompletions }}</div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Target class="h-3 w-3 text-primary" />
            {{ $t('profile.weekLabel') }}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 pb-4 text-center">
          <div class="text-2xl font-bold">{{ statsStore.summary.monthlyCompletions }}</div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar class="h-3 w-3 text-primary" />
            {{ $t('profile.monthLabel') }}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 pb-4 text-center">
          <div class="text-2xl font-bold">{{ statsStore.summary.bestStreakOverall }}</div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Flame class="h-3 w-3 text-orange-500" />
            {{ $t('profile.bestStreak') }}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 pb-4 text-center">
          <div class="text-2xl font-bold">{{ statsStore.summary.currentActiveHabits }}</div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Target class="h-3 w-3 text-muted-foreground" />
            {{ $t('profile.activeHabits') }}
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardContent class="pt-4 pb-4">
        <NuxtLink to="/achievements" class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Award class="h-4 w-4 text-yellow-500" />
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

    <Card v-if="statsStore.heatmap.length > 0">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar class="h-3.5 w-3.5" />
          {{ $t('profile.activity') }}
        </div>
        <StatsCalendarHeatmap :data="statsStore.heatmap" />
      </CardContent>
    </Card>

    <Card v-if="statsStore.summary && statsStore.summary.weeklyDays.length > 0">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Trophy class="h-3.5 w-3.5" />
          {{ $t('profile.weeklyProgress') }}
        </div>
        <StatsWeeklyChart :data="statsStore.summary.weeklyDays" />
      </CardContent>
    </Card>
  </div>
</template>
