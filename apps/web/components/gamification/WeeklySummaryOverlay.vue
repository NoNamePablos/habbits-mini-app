<script setup lang="ts">
import { Check, Flame, Star, Zap, Trophy } from 'lucide-vue-next'
import { Vue3Lottie } from 'vue3-lottie'
import rewardAnimation from '~/assets/animations/daily-reward.json'
import type { WeeklySummaryData } from '~/types/stats'

interface Props {
  show: boolean
  data: WeeklySummaryData
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const { fire } = useConfetti()
const { t } = useI18n()

watch(() => props.show, (val) => {
  if (val) {
    fire('burst')
  }
})

const DAY_KEYS = ['days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat', 'days.sun'] as const

const weekDays = computed<{ label: string; completed: boolean }[]>(() => {
  const days = props.data.weeklyDays
  return days.map((d, i) => ({
    label: t(DAY_KEYS[i]),
    completed: d.total > 0 && d.completed >= d.total,
  }))
})

const completionPercent = computed<number>(() => {
  if (props.data.totalPossible === 0) return 0
  return Math.round((props.data.totalCompletions / props.data.totalPossible) * 100)
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click="$emit('close')"
  >
    <Card class="w-80 text-center animate-in zoom-in-95 duration-300 glass-heavy" @click.stop>
      <CardContent class="pt-4 pb-6 space-y-4">
        <div class="mx-auto w-28 h-28">
          <Vue3Lottie
            :animation-data="rewardAnimation"
            :loop="true"
            :speed="0.8"
          />
        </div>

        <div>
          <h2 class="text-xl font-bold">{{ $t('weeklySummary.title') }}</h2>
          <p class="text-sm text-muted-foreground mt-1">
            {{ $t('weeklySummary.subtitle') }}
          </p>
        </div>

        <div class="flex justify-center gap-2">
          <div
            v-for="(day, index) in weekDays"
            :key="index"
            class="flex flex-col items-center gap-1"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              :class="day.completed
                ? 'bg-green-500 text-white'
                : 'glass text-muted-foreground'"
            >
              <Check v-if="day.completed" class="h-4 w-4" />
            </div>
            <span class="text-[10px] text-muted-foreground">{{ day.label }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-left">
          <div class="glass rounded-xl p-3">
            <div class="flex items-center gap-1.5 mb-1">
              <Trophy class="h-3.5 w-3.5 text-primary" />
              <span class="text-[10px] text-muted-foreground">{{ $t('weeklySummary.completions') }}</span>
            </div>
            <div class="text-lg font-bold leading-tight">
              {{ data.totalCompletions }}<span class="text-sm text-muted-foreground">/{{ data.totalPossible }}</span>
              <span class="text-xs text-muted-foreground ml-1">{{ completionPercent }}%</span>
            </div>
          </div>

          <div class="glass rounded-xl p-3">
            <div class="flex items-center gap-1.5 mb-1">
              <Star class="h-3.5 w-3.5 text-yellow-500" />
              <span class="text-[10px] text-muted-foreground">{{ $t('weeklySummary.perfectDays') }}</span>
            </div>
            <div class="text-lg font-bold leading-tight">
              {{ data.perfectDays }}<span class="text-sm text-muted-foreground">/7</span>
            </div>
          </div>

          <div class="glass rounded-xl p-3">
            <div class="flex items-center gap-1.5 mb-1">
              <Flame class="h-3.5 w-3.5 text-orange-500" />
              <span class="text-[10px] text-muted-foreground">{{ $t('weeklySummary.bestStreak') }}</span>
            </div>
            <div class="text-lg font-bold leading-tight">
              {{ data.bestStreak }}
            </div>
          </div>

          <div class="glass rounded-xl p-3">
            <div class="flex items-center gap-1.5 mb-1">
              <Zap class="h-3.5 w-3.5 text-primary" />
              <span class="text-[10px] text-muted-foreground">XP</span>
            </div>
            <Badge class="text-xs px-2 py-0.5 bg-gradient-gold text-white border-0">
              +{{ data.xpEarned }}
            </Badge>
          </div>
        </div>

        <Button class="w-full bg-gradient-primary border-0 text-white hover:opacity-90" @click="$emit('close')">
          {{ $t('weeklySummary.button') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
