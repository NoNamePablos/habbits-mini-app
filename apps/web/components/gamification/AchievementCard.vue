<script setup lang="ts">
import type { Achievement } from '~/types/gamification'
import { Lock } from 'lucide-vue-next'
import type { Component } from 'vue'

interface Props {
  achievement: Achievement
}

const props = defineProps<Props>()

const { resolveIcon } = useHabitIcon()

const iconComponent = computed<Component>(() => {
  if (props.achievement.icon) return resolveIcon(props.achievement.icon)
  return Lock
})

const getRarity = (xpReward: number): { label: string; colorClass: string } => {
  if (xpReward > 200) return { label: '★★★', colorClass: 'text-amber-400' }
  if (xpReward > 100) return { label: '★★', colorClass: 'text-purple-400' }
  if (xpReward > 50)  return { label: '★', colorClass: 'text-blue-400' }
  return { label: '·', colorClass: 'text-muted-foreground/50' }
}
</script>

<template>
  <Card
    class="transition-all relative"
    :class="achievement.unlocked ? 'glass' : 'glass opacity-50'"
  >
    <CardContent class="pt-4 pb-4 flex flex-col items-center text-center gap-2">
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center relative"
        :class="achievement.unlocked ? 'bg-primary/20 animate-gentle-pulse' : 'bg-muted'"
      >
        <component
          :is="iconComponent"
          class="h-5 w-5 transition-all"
          :class="achievement.unlocked ? 'text-primary icon-glow' : 'text-muted-foreground/30'"
          :style="!achievement.unlocked ? 'filter: grayscale(1)' : ''"
        />
        <Lock
          v-if="!achievement.unlocked"
          class="absolute bottom-0.5 right-0.5 h-3 w-3 text-muted-foreground/60"
        />
      </div>
      <div class="w-full min-w-0">
        <div class="text-xs font-medium truncate">{{ achievement.name }}</div>
        <div class="text-[10px] text-muted-foreground mt-0.5">
          {{ achievement.unlocked ? `+${achievement.xpReward} XP` : achievement.description }}
        </div>
        <div v-if="!achievement.unlocked && achievement.progressMax > 0" class="w-full mt-1.5">
          <div class="h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary/50 rounded-full transition-all"
              :style="{ width: `${Math.min((achievement.progress / achievement.progressMax) * 100, 100)}%` }"
            />
          </div>
          <div class="text-[9px] text-muted-foreground mt-0.5">
            {{ achievement.progress }}/{{ achievement.progressMax }}
          </div>
        </div>
      </div>
    </CardContent>

    <span
      class="absolute top-2 right-2 text-[10px] font-bold leading-none"
      :class="getRarity(achievement.xpReward).colorClass"
    >
      {{ getRarity(achievement.xpReward).label }}
    </span>
  </Card>
</template>
