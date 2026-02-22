<script setup lang="ts">
import { Zap } from 'lucide-vue-next'

const gamificationStore = useGamificationStore()

onMounted(async () => {
  await gamificationStore.fetchProfile()
})
</script>

<template>
  <div v-if="gamificationStore.profile" class="flex items-center gap-2">
    <div class="flex items-center gap-1 text-xs font-medium text-primary">
      <Zap class="h-3 w-3" />
      <span>{{ $t('xpBar.level', { level: gamificationStore.level }) }}</span>
    </div>
    <div class="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        class="h-full bg-primary rounded-full transition-all duration-500"
        :style="{ width: `${gamificationStore.progressPercent}%` }"
      />
    </div>
    <span class="text-[10px] text-muted-foreground">
      {{ gamificationStore.xpForCurrentLevel }}/{{ gamificationStore.xpForNextLevel }}
    </span>
  </div>
</template>
