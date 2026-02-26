import { defineStore } from 'pinia'
import type { Goal, GoalWithProgress, CreateGoalPayload } from '~/types/goal'

export const useGoalsStore = defineStore('goals', () => {
  const api = useApi()
  const { handleError } = useErrorHandler()

  const activeGoal = ref<GoalWithProgress | null>(null)
  const history = ref<Goal[]>([])
  const isLoading = ref<boolean>(false)

  const completedCount = computed<number>(() =>
    toValue(history).filter((g) => g.status === 'completed').length,
  )

  const fetchActiveGoal = async (): Promise<void> => {
    try {
      activeGoal.value = await api.get<GoalWithProgress | null>('/goals/active')
    } catch (error) {
      handleError(error, 'errors.fetchGoal')
    }
  }

  const fetchHistory = async (): Promise<void> => {
    try {
      history.value = await api.get<Goal[]>('/goals/history')
    } catch (error) {
      handleError(error, 'errors.fetchGoal')
    }
  }

  const createGoal = async (payload: CreateGoalPayload): Promise<Goal | null> => {
    try {
      const goal = await api.post<Goal>('/goals', payload)
      await fetchActiveGoal()
      return goal
    } catch (error) {
      handleError(error, 'errors.createGoal')
      return null
    }
  }

  const abandonGoal = async (goalId: number): Promise<void> => {
    try {
      await api.post<Goal>(`/goals/${goalId}/abandon`)
      activeGoal.value = null
    } catch (error) {
      handleError(error, 'errors.abandonGoal')
    }
  }

  return {
    activeGoal,
    history,
    isLoading,
    completedCount,
    fetchActiveGoal,
    fetchHistory,
    createGoal,
    abandonGoal,
  }
})
