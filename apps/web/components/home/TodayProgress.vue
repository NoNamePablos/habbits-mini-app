<script setup lang="ts">
import { Flame } from 'lucide-vue-next'

interface Props {
  completed: number
  total: number
  percent: number
  streak: number
  progressLabel: string
}

defineProps<Props>()
</script>

<template>
  <Card class="glass overflow-hidden">
    <CardContent class="pt-4 pb-4">
      <div class="flex items-center gap-4">
        <div class="flex-1 min-w-0">
          <div class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            {{ $t('home.todayProgress') }}
          </div>
          <div class="flex items-baseline gap-1 mb-1">
            <span class="text-3xl font-black leading-tight text-primary">{{ completed }}</span>
            <span class="text-base text-muted-foreground font-medium">/ {{ total }}</span>
          </div>
          <div class="text-xs text-muted-foreground mb-3">
            {{ $t('home.habitsCompleted') }}
          </div>
          <div
            v-if="streak > 0"
            class="flex items-center gap-1.5 text-sm font-semibold text-orange-500"
          >
            <Flame class="h-4 w-4" />
            {{ $t('home.streakDaysCount', { count: streak }) }}
          </div>
          <p v-if="progressLabel" class="text-[11px] text-muted-foreground mt-1.5">
            {{ progressLabel }}
          </p>
        </div>

        <ChallengesChallengeProgress
          :percent="percent"
          :size="100"
          :stroke-width="8"
          color="var(--primary)"
        >
          <span class="text-lg font-black">{{ percent }}%</span>
        </ChallengesChallengeProgress>
      </div>
    </CardContent>
  </Card>
</template>
