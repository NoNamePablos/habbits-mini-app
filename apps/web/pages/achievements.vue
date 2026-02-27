<script setup lang="ts">
import { Trophy, Clock } from 'lucide-vue-next'
import type { AchievementCategory } from '~/types/gamification'

const gamificationStore = useGamificationStore()
const { resolveIcon } = useHabitIcon()
const { locale } = useI18n()

type SortMode = 'default' | 'closest'
const activeTab = ref<AchievementCategory | 'all'>('all')
const sortMode = ref<SortMode>('default')

onMounted(async () => {
  await gamificationStore.fetchAchievements()
})

const tabCount = (tab: AchievementCategory | 'all'): number => {
  const all = gamificationStore.achievements
  if (tab === 'all') return all.length
  return all.filter((a) => a.category === tab).length
}

const displayedAchievements = computed(() => {
  let list = gamificationStore.achievements
  if (toValue(activeTab) !== 'all') {
    list = list.filter((a) => a.category === toValue(activeTab))
  }
  if (toValue(sortMode) === 'closest') {
    list = [...list].sort((a, b) => {
      if (a.unlocked && b.unlocked) return 0
      if (a.unlocked) return 1
      if (b.unlocked) return -1
      const remA = a.progressMax > 0 ? a.progressMax - a.progress : Infinity
      const remB = b.progressMax > 0 ? b.progressMax - b.progress : Infinity
      return remA - remB
    })
  }
  return list
})

const unlockedHistory = computed(() =>
  gamificationStore.achievements
    .filter((a) => a.unlocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 10),
)

const formatUnlockedDate = (dateStr: string | null): string => {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short' }).format(new Date(dateStr))
}
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center gap-2">
      <Trophy class="h-5 w-5 text-primary icon-glow" />
      <h1 class="text-2xl font-bold">{{ $t('achievements.title') }}</h1>
      <Badge v-if="gamificationStore.totalCount > 0" variant="secondary" class="ml-auto">
        {{ gamificationStore.unlockedCount }}/{{ gamificationStore.totalCount }}
      </Badge>
    </div>

    <GamificationAchievementsPageSkeleton v-if="gamificationStore.isLoading" />

    <template v-else>
      <GamificationAchievementSortSelect
        :model-value="sortMode"
        @update:model-value="sortMode = $event"
      />

      <GamificationAchievementCategoryTabs
        :model-value="activeTab"
        :achievements="displayedAchievements"
        :tab-count="tabCount"
        @update:model-value="activeTab = $event"
      />

      <div
        v-if="gamificationStore.achievements.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center space-y-2"
      >
        <Trophy class="h-12 w-12 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">{{ $t('achievements.emptyMessage') }}</p>
      </div>

      <template v-if="unlockedHistory.length > 0">
        <div class="flex items-center gap-2 pt-2">
          <Clock class="h-4 w-4 text-muted-foreground" />
          <h2 class="text-sm font-semibold">{{ $t('achievements.history') }}</h2>
        </div>
        <Card class="glass">
          <CardContent class="pt-4 pb-4 space-y-3">
            <div v-for="ach in unlockedHistory" :key="ach.id" class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <component
                  :is="resolveIcon(ach.icon)"
                  class="h-4 w-4 text-primary"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium truncate">{{ ach.name }}</div>
                <div class="text-[10px] text-muted-foreground">{{ formatUnlockedDate(ach.unlockedAt) }}</div>
              </div>
              <Badge variant="secondary" class="text-[10px] shrink-0">+{{ ach.xpReward }} XP</Badge>
            </div>
          </CardContent>
        </Card>
      </template>
    </template>
  </div>
</template>
