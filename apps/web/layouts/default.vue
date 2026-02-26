<script setup lang="ts">
import { Flame, Home, Trophy, User, Settings } from 'lucide-vue-next'
import type { Component } from 'vue'

const authStore = useAuthStore()
const gamificationStore = useGamificationStore()
const statsStore = useStatsStore()
const route = useRoute()
const { t } = useI18n()

const lastMondayISO = ((): string => {
  const now = new Date()
  const day = now.getDay()
  const offset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + offset - 7)
  return monday.toISOString().split('T')[0]
})()

const { hasSeenOnboarding: hasSeenWeeklySummary, markAsSeen: markWeeklySummarySeen } =
  useOnboarding(`weeklySummary_${lastMondayISO}`)

onMounted(async () => {
  await authStore.authenticate()
  await gamificationStore.fetchProfile()

  if (new Date().getDay() === 1 && !toValue(hasSeenWeeklySummary)) {
    await statsStore.fetchWeeklySummary()
  }
})

interface NavTab {
  path: string
  icon: Component
  label: string
}

const tabs = computed<NavTab[]>(() => [
  { path: '/', icon: Home, label: t('nav.home') },
  { path: '/challenges', icon: Flame, label: t('nav.challenges') },
  { path: '/achievements', icon: Trophy, label: t('nav.achievements') },
  { path: '/profile', icon: User, label: t('nav.profile') },
])

const activeTab = computed<string>(() => {
  if (route.path.startsWith('/challenges')) return '/challenges'
  if (route.path.startsWith('/habits')) return '/'
  if (route.path.startsWith('/settings')) return ''
  return route.path
})

const showUserHeader = computed<boolean>(() =>
  !route.path.startsWith('/profile') && !route.path.startsWith('/settings'),
)

const showDailyBonus = computed<boolean>(() => authStore.dailyLoginXp !== null)

const showWeeklySummary = computed<boolean>(() =>
  !toValue(showDailyBonus)
  && !toValue(hasSeenWeeklySummary)
  && statsStore.weeklySummary !== null,
)

const onDailyBonusClose = (): void => {
  authStore.clearDailyBonus()
}

const onWeeklySummaryClose = (): void => {
  markWeeklySummarySeen()
  statsStore.weeklySummary = null
}
</script>

<template>
  <div class="flex flex-col h-full bg-background text-foreground bg-mesh">
    <header class="flex items-center justify-between px-3 py-2 glass-nav border-b border-white/10 dark:border-white/5">
      <div class="flex items-center gap-1.5">
        <Flame class="h-4 w-4 text-primary icon-glow" />
        <span class="text-sm font-bold tracking-wide">{{ $t('nav.appTitle') }}</span>
      </div>
      <NuxtLink to="/settings" class="text-muted-foreground hover:text-foreground transition-colors p-1">
        <Settings class="h-4.5 w-4.5" />
      </NuxtLink>
    </header>

    <main class="flex-1 overflow-y-auto">
      <SharedUserHeader v-if="showUserHeader" />
      <slot />
    </main>

    <nav class="flex items-center justify-around glass-nav border-t border-white/10 dark:border-white/5 pb-safe">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="flex flex-col items-center gap-0.5 py-1.5 px-4 transition-colors"
        :class="[
          activeTab === tab.path
            ? 'text-primary'
            : 'text-muted-foreground',
        ]"
      >
        <div
          v-if="tab.path === '/challenges'"
          class="challenges-nav-icon"
          :class="activeTab === tab.path ? 'challenges-nav-icon--active' : ''"
        >
          <component :is="tab.icon" class="h-4 w-4 text-white" />
        </div>
        <component
          :is="tab.icon"
          v-else
          class="h-5 w-5"
          :class="activeTab === tab.path ? 'icon-glow' : ''"
        />
        <span class="text-[10px] font-medium">{{ tab.label }}</span>
      </NuxtLink>
    </nav>

    <GamificationDailyBonusOverlay
      :show="showDailyBonus"
      :xp="authStore.dailyLoginXp ?? 0"
      :week-login-days="authStore.weekLoginDays"
      @close="onDailyBonusClose"
    />

    <GamificationWeeklySummaryOverlay
      v-if="statsStore.weeklySummary"
      :show="showWeeklySummary"
      :data="statsStore.weeklySummary"
      @close="onWeeklySummaryClose"
    />
  </div>
</template>

<style lang="scss" scoped>
.pb-safe {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
</style>
