import { defineStore } from 'pinia'
import type { StatsSummary, HeatmapDay, HabitStats, WeeklySummaryData } from '~/types/stats'
import { DEFAULT_HEATMAP_MONTHS } from '~/constants'

export const useStatsStore = defineStore('stats', () => {
  const api = useApi()
  const { handleError } = useErrorHandler()
  const summary = ref<StatsSummary | null>(null)
  const heatmap = ref<HeatmapDay[]>([])
  const isLoading = ref<boolean>(false)

  const fetchSummary = async (): Promise<void> => {
    isLoading.value = true
    try {
      summary.value = await api.get<StatsSummary>('/stats/summary')
    } catch (error) {
      handleError(error, 'errors.fetchSummary')
    } finally {
      isLoading.value = false
    }
  }

  const fetchHeatmap = async (months: number = DEFAULT_HEATMAP_MONTHS): Promise<void> => {
    try {
      heatmap.value = await api.get<HeatmapDay[]>(`/stats/heatmap?months=${months}`)
    } catch (error) {
      handleError(error, 'errors.fetchHeatmap')
    }
  }

  const weeklySummary = ref<WeeklySummaryData | null>(null)

  const fetchWeeklySummary = async (): Promise<void> => {
    try {
      weeklySummary.value = await api.get<WeeklySummaryData>('/stats/weekly-summary')
    } catch (error) {
      handleError(error, 'errors.fetchSummary')
    }
  }

  const fetchHabitStats = async (habitId: number): Promise<HabitStats | null> => {
    try {
      return await api.get<HabitStats>(`/stats/habits/${habitId}`)
    } catch (error) {
      handleError(error, 'errors.fetchHabitStats')
      return null
    }
  }

  return {
    summary,
    heatmap,
    weeklySummary,
    isLoading,
    fetchSummary,
    fetchHeatmap,
    fetchWeeklySummary,
    fetchHabitStats,
  }
})
