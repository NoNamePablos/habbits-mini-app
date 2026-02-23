<script setup lang="ts">
import type { Achievement } from '~/types/gamification'
import { Lock } from 'lucide-vue-next'

interface Props {
  achievement: Achievement
}

defineProps<Props>()

const { resolveIcon } = useHabitIcon()
</script>

<template>
  <Card
    class="transition-all"
    :class="achievement.unlocked ? 'glass' : 'glass opacity-50'"
  >
    <CardContent class="pt-4 pb-4 flex flex-col items-center text-center gap-2">
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center"
        :class="achievement.unlocked ? 'bg-primary/20 animate-gentle-pulse' : 'bg-muted'"
      >
        <component
          :is="achievement.unlocked && achievement.icon ? resolveIcon(achievement.icon) : Lock"
          class="h-5 w-5"
          :class="achievement.unlocked ? 'text-primary icon-glow' : 'text-muted-foreground'"
        />
      </div>
      <div>
        <div class="text-xs font-medium truncate">{{ achievement.name }}</div>
        <div class="text-[10px] text-muted-foreground mt-0.5">
          {{ achievement.unlocked ? `+${achievement.xpReward} XP` : achievement.description }}
        </div>
      </div>
    </CardContent>
  </Card>
</template>
