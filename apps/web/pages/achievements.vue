<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import type { AchievementCategory } from '~/types/gamification'
import { ACHIEVEMENT_CATEGORIES } from '~/types/gamification'

const gamificationStore = useGamificationStore()

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

const onSortChange = (v: string): void => {
  sortMode.value = v as SortMode
}

const onTabChange = (v: string): void => {
  activeTab.value = v as AchievementCategory | 'all'
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
      <!-- Sort -->
      <div class="flex items-center justify-end">
        <Select :model-value="sortMode" @update:model-value="onSortChange">
          <SelectTrigger class="h-8 w-44 text-xs glass border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{{ $t('achievements.sortDefault') }}</SelectItem>
            <SelectItem value="closest">{{ $t('achievements.sortClosest') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Category tabs -->
      <Tabs :model-value="activeTab" @update:model-value="onTabChange">
        <TabsList class="w-full glass h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="all" class="text-xs flex-1">
            {{ $t('achievements.categoryAll') }}
            <span class="ml-1 text-[10px] opacity-60">({{ tabCount('all') }})</span>
          </TabsTrigger>
          <TabsTrigger
            v-for="cat in ACHIEVEMENT_CATEGORIES"
            :key="cat"
            :value="cat"
            class="text-xs flex-1"
          >
            {{ $t(`achievements.category.${cat}`) }}
            <span class="ml-1 text-[10px] opacity-60">({{ tabCount(cat) }})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" class="mt-3">
          <div class="grid grid-cols-2 gap-3">
            <GamificationAchievementCard
              v-for="(achievement, index) in displayedAchievements"
              :key="achievement.id"
              :achievement="achievement"
              class="stagger-item"
              :style="{ '--stagger': index }"
            />
          </div>
        </TabsContent>

        <TabsContent
          v-for="cat in ACHIEVEMENT_CATEGORIES"
          :key="cat"
          :value="cat"
          class="mt-3"
        >
          <div class="grid grid-cols-2 gap-3">
            <GamificationAchievementCard
              v-for="(achievement, index) in displayedAchievements"
              :key="achievement.id"
              :achievement="achievement"
              class="stagger-item"
              :style="{ '--stagger': index }"
            />
          </div>
          <div
            v-if="displayedAchievements.length === 0"
            class="flex flex-col items-center justify-center py-8 text-center space-y-2"
          >
            <p class="text-sm text-muted-foreground">{{ $t('achievements.categoryEmpty') }}</p>
          </div>
        </TabsContent>
      </Tabs>

      <div
        v-if="gamificationStore.achievements.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center space-y-2"
      >
        <Trophy class="h-12 w-12 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">{{ $t('achievements.emptyMessage') }}</p>
      </div>
    </template>
  </div>
</template>
