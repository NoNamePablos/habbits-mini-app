<script setup lang="ts">
import type { ChallengeDay } from '~/types/challenge'

interface Props {
  days: ChallengeDay[]
  startDate: string
  durationDays: number
}

const props = defineProps<Props>()

interface Cell {
  date: string
  isToday: boolean
  colorClass: string
}

const cells = computed<Cell[]>(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const start = new Date(props.startDate + 'T00:00:00')
  const fourteenAgo = new Date(today)
  fourteenAgo.setDate(today.getDate() - 13)

  const fromDate = start > fourteenAgo ? start : fourteenAgo
  const checkedSet = new Set(props.days.map((d) => d.dayDate))

  const result: Cell[] = []
  const cursor = new Date(fromDate)

  while (cursor <= today) {
    const dateStr = cursor.toISOString().split('T')[0]
    const isToday = dateStr === todayStr
    const isChecked = checkedSet.has(dateStr)
    const isPast = cursor.getTime() < today.getTime()

    let colorClass: string
    if (isChecked) {
      colorClass = 'bg-green-500'
    } else if (isPast) {
      colorClass = 'bg-foreground/10'
    } else {
      colorClass = 'bg-foreground/5'
    }

    result.push({ date: dateStr, isToday, colorClass })
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
})
</script>

<template>
  <div class="flex gap-1 flex-wrap">
    <div
      v-for="cell in cells"
      :key="cell.date"
      class="w-5 h-5 rounded-sm transition-all"
      :class="[
        cell.colorClass,
        cell.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : '',
      ]"
      :title="cell.date"
    />
  </div>
</template>
