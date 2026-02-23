<script setup lang="ts">
import type { ChallengeDay } from '~/types/challenge'
import { Check, X } from 'lucide-vue-next'

interface Props {
  startDate: string
  durationDays: number
  days: ChallengeDay[]
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#8774e1',
})

interface DayCell {
  date: string
  dayNumber: number
  status: 'completed' | 'missed' | 'today' | 'upcoming'
}

const today = computed<string>(() =>
  new Intl.DateTimeFormat('en-CA').format(new Date()),
)

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

const dayCells = computed<DayCell[]>(() => {
  const dayMap = new Map(props.days.map((d) => [d.dayDate, d.status]))
  const cells: DayCell[] = []

  for (let i = 0; i < props.durationDays; i++) {
    const date = addDays(props.startDate, i)
    const recorded = dayMap.get(date)
    let status: DayCell['status']

    if (recorded === 'completed') {
      status = 'completed'
    } else if (recorded === 'missed') {
      status = 'missed'
    } else if (date === toValue(today)) {
      status = 'today'
    } else {
      status = 'upcoming'
    }

    cells.push({ date, dayNumber: i + 1, status })
  }

  return cells
})
</script>

<template>
  <div class="grid grid-cols-7 gap-1.5">
    <div
      v-for="cell in dayCells"
      :key="cell.date"
      class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-all"
      :class="{
        'text-white': cell.status === 'completed',
        'bg-destructive/80 text-white': cell.status === 'missed',
        'animate-gentle-pulse': cell.status === 'today',
        'glass text-muted-foreground': cell.status === 'upcoming',
      }"
      :style="{
        backgroundColor: cell.status === 'completed' ? props.color : undefined,
        border: cell.status === 'today' ? `2px solid ${props.color}` : undefined,
        color: cell.status === 'today' ? props.color : undefined,
      }"
    >
      <Check v-if="cell.status === 'completed'" class="h-3.5 w-3.5" />
      <X v-else-if="cell.status === 'missed'" class="h-3.5 w-3.5" />
      <span v-else>{{ cell.dayNumber }}</span>
    </div>
  </div>
</template>
