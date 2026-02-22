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
</script>

<template>
  <div class="flex flex-col h-full bg-background text-foreground">
    <header class="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <div class="flex items-center gap-2">
        <Flame class="h-5 w-5 text-primary" />
        <span class="text-lg font-bold">{{ $t('nav.appTitle') }}</span>
      </div>
      <GamificationXPBar />
    </header>

    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>

    <nav class="flex items-center justify-around bg-card border-t border-border pb-safe">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="flex flex-col items-center gap-1 py-2 px-4 transition-colors"
        :class="[
          activeTab === tab.path
            ? 'text-primary'
            : 'text-muted-foreground',
        ]"
      >
        <component :is="tab.icon" class="h-5 w-5" />
        <span class="text-[10px] font-medium">{{ tab.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
.pb-safe {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
</style>
