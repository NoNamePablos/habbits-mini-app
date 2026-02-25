<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'

const gamificationStore = useGamificationStore()

onMounted(async () => {
  await gamificationStore.fetchAchievements()
})
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

    <div v-else class="grid grid-cols-2 gap-3">
      <GamificationAchievementCard
        v-for="(achievement, index) in gamificationStore.achievements"
        :key="achievement.id"
        :achievement="achievement"
        class="stagger-item"
        :style="{ '--stagger': index }"
      />
    </div>

    <div
      v-if="!gamificationStore.isLoading && gamificationStore.achievements.length === 0"
      class="flex flex-col items-center justify-center py-12 text-center space-y-2"
    >
      <Trophy class="h-12 w-12 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        {{ $t('achievements.emptyMessage') }}
      </p>
    </div>
  </div>
</template>
