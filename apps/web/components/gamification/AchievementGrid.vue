<script setup lang="ts">
import type { Achievement } from '~/types/gamification'

defineProps<{
  achievements: Achievement[]
  emptyMessage?: string
}>()
</script>

<template>
  <div v-if="achievements.length > 0" class="grid grid-cols-2 gap-3">
    <GamificationAchievementCard
      v-for="(achievement, index) in achievements"
      :key="achievement.id"
      :achievement="achievement"
      class="stagger-item"
      :style="{ '--stagger': index }"
    />
  </div>
  <div
    v-else-if="emptyMessage"
    class="flex flex-col items-center justify-center py-8 text-center"
  >
    <p class="text-sm text-muted-foreground">{{ emptyMessage }}</p>
  </div>
</template>
