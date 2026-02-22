<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import type { DaySummary } from '~/types/stats'

interface Props {
  data: DaySummary[]
}

const props = defineProps<Props>()

const { t } = useI18n()
const { primary, mutedForeground } = useChartColors()

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const series = computed<{ data: number[] }[]>(() => [{
  data: props.data.map((day) =>
    day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0,
  ),
}])

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    toolbar: { show: false },
    parentHeightOffset: 0,
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '55%',
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: props.data.map((day) => {
      const dow = new Date(day.date).getDay()
      return t(`days.${DAY_KEYS[dow]}`)
    }),
    labels: {
      style: { fontSize: '10px', colors: toValue(mutedForeground) },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { show: false, max: 100 },
  grid: { show: false, padding: { top: -10, bottom: -5, left: -10, right: -10 } },
  colors: [toValue(primary)],
  tooltip: {
    enabled: true,
    y: { formatter: (val: number): string => `${val}%` },
  },
}))
</script>

<template>
  <apexchart type="bar" height="120" :options="chartOptions" :series="series" />
</template>
