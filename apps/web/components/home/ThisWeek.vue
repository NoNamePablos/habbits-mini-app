<script setup lang="ts">
import type { DaySummary } from '~/types/stats'

interface Props {
  days: Array<DaySummary & { label: string; isToday: boolean; isFuture: boolean }>
}

defineProps<Props>()

const getDayNumber = (dateStr: string): number =>
  new Date(dateStr + 'T00:00:00').getDate()
</script>

<template>
  <Card class="glass overflow-hidden">
    <CardContent class="pt-4 pb-4">
      <div class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
        {{ $t('home.thisWeek') }}
      </div>
      <div class="flex items-center justify-between">
        <div
          v-for="(day, index) in days"
          :key="index"
          class="flex flex-col items-center gap-1.5"
        >
          <span
            class="text-[10px] font-medium"
            :class="day.isToday ? 'text-primary' : 'text-muted-foreground'"
          >
            {{ day.label }}
          </span>
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center transition-all text-[11px] font-bold"
            :class="[
              day.isFuture
                ? 'bg-secondary/20 text-muted-foreground/30'
                : day.completed >= day.total && day.total > 0
                  ? 'bg-green-500 text-white'
                  : day.completed > 0
                    ? 'bg-green-500/25 text-green-500 border border-green-500/50'
                    : 'bg-destructive/10 text-muted-foreground border border-destructive/25',
              day.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : '',
            ]"
          >
            {{ getDayNumber(day.date) }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
