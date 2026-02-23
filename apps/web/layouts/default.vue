<script setup lang="ts">
import { Flame, Home, Trophy, User } from 'lucide-vue-next'
import type { Component } from 'vue'

const authStore = useAuthStore()
const route = useRoute()
const { t } = useI18n()

onMounted(async () => {
  await authStore.authenticate()
})

interface NavTab {
  path: string
  icon: Component
  label: string
}

const tabs = computed<NavTab[]>(() => [
  { path: '/', icon: Home, label: t('nav.home') },
  { path: '/achievements', icon: Trophy, label: t('nav.achievements') },
  { path: '/profile', icon: User, label: t('nav.profile') },
])

const activeTab = computed<string>(() => route.path)

const showDailyBonus = computed<boolean>(() => authStore.dailyLoginXp !== null)

const onDailyBonusClose = (): void => {
  authStore.clearDailyBonus()
}
</script>

<template>
  <div class="flex flex-col h-full bg-background text-foreground bg-mesh">
    <header class="flex items-center justify-between px-3 py-2 glass-nav border-b border-white/10 dark:border-white/5">
      <div class="flex items-center gap-1.5">
        <Flame class="h-4 w-4 text-primary icon-glow" />
        <span class="text-sm font-bold tracking-wide">{{ $t('nav.appTitle') }}</span>
      </div>
      <GamificationXPBar />
    </header>

    <main class="flex-1 overflow-y-auto">
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
        <component :is="tab.icon" class="h-5 w-5" :class="activeTab === tab.path ? 'icon-glow' : ''" />
        <span class="text-[10px] font-medium">{{ tab.label }}</span>
      </NuxtLink>
    </nav>

    <GamificationDailyBonusOverlay
      :show="showDailyBonus"
      :xp="authStore.dailyLoginXp ?? 0"
      :week-login-days="authStore.weekLoginDays"
      @close="onDailyBonusClose"
    />
  </div>
</template>

<style lang="scss" scoped>
.pb-safe {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
</style>
