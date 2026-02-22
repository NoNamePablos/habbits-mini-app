<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import type { HeatmapDay } from '~/types/stats'

interface Props {
  data: HeatmapDay[]
}

const props = defineProps<Props>()

const { t } = useI18n()
const { primaryShades, mutedForeground } = useChartColors()

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const series = computed<{ name: string; data: { x: string; y: number }[] }[]>(() => {
  const days = toValue(props.data)
  if (days.length === 0) return []

  const flat: number[] = []

  const firstDow = new Date(days[0].date).getDay()
  for (let i = 0; i < firstDow; i++) {
    flat.push(0)
  }

  for (const day of days) {
    flat.push(day.level)
  }

  while (flat.length % 7 !== 0) {
    flat.push(0)
  }

  const numWeeks = flat.length / 7
  const grid: number[][] = []
  for (let w = 0; w < numWeeks; w++) {
    grid.push(flat.slice(w * 7, w * 7 + 7))
  }

  const dayOrder = [0, 6, 5, 4, 3, 2, 1]

  return dayOrder.map((dow) => ({
    name: t(`days.${DAY_KEYS[dow]}`),
    data: grid.map((week, wi) => ({
      x: String(wi + 1),
      y: week[dow],
    })),
  }))
})

const chartOptions = computed<ApexOptions>(() => {
  const shades = toValue(primaryShades)

  return {
    chart: {
      toolbar: { show: false },
      parentHeightOffset: 0,
    },
    dataLabels: { enabled: false },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '9px', colors: toValue(mutedForeground) },
      },
    },
    grid: { show: false, padding: { top: -20, bottom: -10, left: 0, right: 0 } },
    plotOptions: {
      heatmap: {
        radius: 2,
        enableShades: false,
        colorScale: {
          ranges: shades.map((color, i) => ({
            from: i,
            to: i,
            color,
          })),
        },
      },
    },
    tooltip: { enabled: false },
    legend: { show: false },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } },
    },
  }
})
</script>

<template>
  <div>
    <apexchart type="heatmap" height="140" :options="chartOptions" :series="series" />
    <div class="flex items-center gap-1 justify-end -mt-2">
      <span class="text-[9px] text-muted-foreground">{{ $t('heatmap.less') }}</span>
      <div
        v-for="(shade, i) in primaryShades"
        :key="i"
        class="w-[10px] h-[10px] rounded-[2px]"
        :style="{ backgroundColor: shade }"
      />
      <span class="text-[9px] text-muted-foreground">{{ $t('heatmap.more') }}</span>
    </div>
  </div>
</template>
