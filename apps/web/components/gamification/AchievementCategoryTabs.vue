<script setup lang="ts">
import type { Achievement, AchievementCategory } from '~/types/gamification'
import { ACHIEVEMENT_CATEGORIES } from '~/types/gamification'

defineProps<{
  modelValue: AchievementCategory | 'all'
  achievements: Achievement[]
  tabCount: (tab: AchievementCategory | 'all') => number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AchievementCategory | 'all']
}>()

const onTabChange = (v: string | number): void => {
  emit('update:modelValue', String(v) as AchievementCategory | 'all')
}
</script>

<template>
  <Tabs :model-value="modelValue" @update:model-value="onTabChange">
    <div class="overflow-x-auto -mx-4 px-4 no-scrollbar">
      <TabsList class="glass h-auto p-1 inline-flex gap-1 min-w-full">
        <TabsTrigger value="all" class="text-xs shrink-0">
          {{ $t('achievements.categoryAll') }}
          <span class="ml-1 text-[10px] opacity-60">({{ tabCount('all') }})</span>
        </TabsTrigger>
        <TabsTrigger
          v-for="cat in ACHIEVEMENT_CATEGORIES"
          :key="cat"
          :value="cat"
          class="text-xs shrink-0"
        >
          {{ $t(`achievements.category.${cat}`) }}
          <span class="ml-1 text-[10px] opacity-60">({{ tabCount(cat) }})</span>
        </TabsTrigger>
      </TabsList>
    </div>

    <TabsContent value="all" class="mt-3">
      <GamificationAchievementGrid :achievements="achievements" />
    </TabsContent>
    <TabsContent
      v-for="cat in ACHIEVEMENT_CATEGORIES"
      :key="cat"
      :value="cat"
      class="mt-3"
    >
      <GamificationAchievementGrid
        :achievements="achievements"
        :empty-message="$t('achievements.categoryEmpty')"
      />
    </TabsContent>
  </Tabs>
</template>

<style lang="scss" scoped>
.no-scrollbar {
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
</style>
