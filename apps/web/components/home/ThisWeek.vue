<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { DaySummary } from '~/types/stats'

const api = useApi()
const { t, locale } = useI18n()

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

interface WeekDay extends DaySummary {
  label: string
  isToday: boolean
  isFuture: boolean
}

const weekOffset = ref<number>(0)
const days = ref<WeekDay[]>([])
const isLoading = ref<boolean>(false)

const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date())

const fetchWeek = async (): Promise<void> => {
  isLoading.value = true
  try {
    const raw = await api.get<DaySummary[]>(`/stats/week?offset=${weekOffset.value}`)
    days.value = raw.map((d) => {
      const date = new Date(d.date + 'T00:00:00')
      return {
        ...d,
        label: t(`days.${DAY_KEYS[date.getDay()]}`),
        isToday: d.date === todayStr,
        isFuture: weekOffset.value === 0 && d.date > todayStr,
      }
    })
  } finally {
    isLoading.value = false
  }
}

watch(weekOffset, fetchWeek, { immediate: true })

const weekLabel = computed<string>(() => {
  if (weekOffset.value === 0) return t('home.thisWeek')
  if (!days.value.length) return ''
  const fmt = new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
  })
  const first = new Date(days.value[0].date + 'T00:00:00')
  const last = new Date(days.value[6].date + 'T00:00:00')
  return `${fmt.format(first)} – ${fmt.format(last)}`
})

const getDayNumber = (dateStr: string): number =>
  new Date(dateStr + 'T00:00:00').getDate()

const onPrev = (): void => {
  weekOffset.value--
}

const onNext = (): void => {
  if (weekOffset.value < 0) weekOffset.value++
}
</script>

<template>
  <Card class="glass overflow-hidden">
    <CardContent class="pt-4 pb-4">
      <div class="flex items-center justify-between mb-3">
        <button
          class="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
          @click="onPrev"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>

        <div class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {{ weekLabel }}
        </div>

        <button
          class="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
          :class="weekOffset >= 0 ? 'text-muted-foreground/20 cursor-default' : 'text-muted-foreground hover:text-foreground'"
          :disabled="weekOffset >= 0"
          @click="onNext"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>

      <div class="flex items-center justify-between" :class="{ 'opacity-50': isLoading }">
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
