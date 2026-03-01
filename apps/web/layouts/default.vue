<script setup lang="ts">
import { Flame, Home, User, Settings, Search, Users } from 'lucide-vue-next'
import type { Component } from 'vue'

const authStore = useAuthStore()
const friendsStore = useFriendsStore()
const challengesStore = useChallengesStore()
const showSearch = ref<boolean>(false)
const gamificationStore = useGamificationStore()
const statsStore = useStatsStore()
const route = useRoute()
const { t } = useI18n()
const { tg: webApp } = useTelegram()

const friendRequestsBadge = computed<number>(() => friendsStore.pendingCount)

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
  await Promise.all([
    gamificationStore.fetchProfile(),
    friendsStore.fetchPendingCount(),
  ])

  if (new Date().getDay() === 1 && !toValue(hasSeenWeeklySummary)) {
    await statsStore.fetchWeeklySummary()
  }

  // Handle deep links from Telegram start_param
  const startParam = webApp?.initDataUnsafe?.start_param
  if (startParam) {
    if (startParam.startsWith('fi_')) {
      const code = startParam.slice(3)
      const ok = await friendsStore.requestByCode(code)
      if (ok) navigateTo('/friends')
    } else if (startParam.startsWith('ci_')) {
      const code = startParam.slice(3)
      const result = await challengesStore.joinByCode(code)
      if (result) navigateTo(`/challenges/${result.challenge.id}`)
    }
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
  { path: '/friends', icon: Users, label: t('nav.friends') },
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
  void markWeeklySummarySeen()
  statsStore.weeklySummary = null
}
</script>

<template>
  <div class="flex flex-col h-full bg-background text-foreground bg-mesh">
    <header class="flex items-center justify-between px-3 py-2 glass-nav border-b border-black/[0.07] dark:border-white/10">
      <div class="flex items-center gap-1.5">
        <Flame class="h-4 w-4 text-primary icon-glow" />
        <span class="text-sm font-bold tracking-wide">{{ $t('nav.appTitle') }}</span>
      </div>
      <div class="flex items-center gap-1">
        <button class="text-muted-foreground hover:text-foreground transition-colors p-1" @click="showSearch = true">
          <Search class="h-4 w-4" />
        </button>
        <NuxtLink to="/settings" class="text-muted-foreground hover:text-foreground transition-colors p-1">
          <Settings class="h-4.5 w-4.5" />
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto">
      <div class="max-w-120 mx-auto w-full">
        <SharedUserHeader v-if="showUserHeader" />
        <slot />
      </div>
    </main>

    <nav class="flex items-center justify-around glass-nav border-t border-black/[0.07] dark:border-white/10 pb-safe">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="flex flex-col items-center gap-0.5 py-1.5 px-3 transition-colors"
        :class="[activeTab === tab.path ? 'text-primary' : 'text-muted-foreground']"
      >
        <div
          v-if="tab.path === '/challenges'"
          class="challenges-nav-icon"
          :class="activeTab === tab.path ? 'challenges-nav-icon--active' : ''"
        >
          <component :is="tab.icon" class="h-4 w-4 text-white" />
        </div>
        <div v-else-if="tab.path === '/friends'" class="relative">
          <component
            :is="tab.icon"
            class="h-5 w-5"
            :class="activeTab === tab.path ? 'icon-glow' : ''"
          />
          <span
            v-if="friendRequestsBadge > 0"
            class="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center px-0.5"
          >
            {{ friendRequestsBadge > 9 ? '9+' : friendRequestsBadge }}
          </span>
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

    <SharedGlobalSearch v-model:open="showSearch" />

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
