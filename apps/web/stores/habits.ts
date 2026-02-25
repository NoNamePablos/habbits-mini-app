import { defineStore } from 'pinia'
import type {
  Habit,
  HabitCompletion,
  HabitsListResponse,
  CompleteResponse,
  CreateHabitPayload,
  TimeOfDay,
} from '~/types/habit'
interface HabitGroup {
  key: TimeOfDay
  habits: Habit[]
}

export const useHabitsStore = defineStore('habits', () => {
  const api = useApi()
  const { handleError } = useErrorHandler()
  const habits = ref<Habit[]>([])
  const todayCompletions = ref<HabitCompletion[]>([])
  const isLoading = ref<boolean>(true)

  const completedIds = computed<Set<number>>(() => {
    return new Set(toValue(todayCompletions).map((c) => c.habitId))
  })

  const totalToday = computed<number>(() => toValue(habits).length)

  const completedToday = computed<number>(() => toValue(completedIds).size)

  const progressPercent = computed<number>(() => {
    const total = toValue(totalToday)
    if (total === 0) return 0
    return Math.round((toValue(completedToday) / total) * 100)
  })

  const groupedByTimeOfDay = computed<HabitGroup[]>(() => {
    const order: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime']
    const groups: HabitGroup[] = []

    for (const key of order) {
      const filtered = toValue(habits).filter((h) => h.timeOfDay === key)
      if (filtered.length > 0) {
        groups.push({ key, habits: filtered })
      }
    }

    return groups
  })

  const isCompleted = (habitId: number): boolean => toValue(completedIds).has(habitId)

  const fetchHabits = async (): Promise<void> => {
    isLoading.value = true
    try {
      const data = await api.get<HabitsListResponse>('/habits')
      habits.value = data.habits
      todayCompletions.value = data.todayCompletions
    } catch (error) {
      handleError(error, 'errors.fetchHabits')
    } finally {
      isLoading.value = false
    }
  }

  const completeHabit = async (habitId: number): Promise<CompleteResponse | null> => {
    const today = new Date().toISOString().split('T')[0]
    const fakeCompletion: HabitCompletion = {
      id: -Date.now(),
      habitId,
      userId: 0,
      completedDate: today,
      value: null,
      xpEarned: 0,
      note: null,
      createdAt: new Date().toISOString(),
    }

    const previousCompletions = [...toValue(todayCompletions)]
    const previousHabits = [...toValue(habits)]

    todayCompletions.value = [...previousCompletions, fakeCompletion]

    try {
      const result = await api.post<CompleteResponse>(`/habits/${habitId}/complete`)

      todayCompletions.value = toValue(todayCompletions).map((c) =>
        c.id === fakeCompletion.id ? result.completion : c,
      )

      const idx = toValue(habits).findIndex((h) => h.id === habitId)
      if (idx !== -1) {
        habits.value[idx] = result.habit
      }

      return result
    } catch (error) {
      todayCompletions.value = previousCompletions
      habits.value = previousHabits
      handleError(error, 'errors.completeHabit')
      return null
    }
  }

  const uncompleteHabit = async (habitId: number, date: string): Promise<void> => {
    const previousCompletions = [...toValue(todayCompletions)]
    const previousHabits = [...toValue(habits)]

    todayCompletions.value = toValue(todayCompletions).filter((c) => c.habitId !== habitId)

    try {
      const updatedHabit = await api.del<Habit>(`/habits/${habitId}/complete/${date}`)

      const idx = toValue(habits).findIndex((h) => h.id === habitId)
      if (idx !== -1) {
        habits.value[idx] = updatedHabit
      }
    } catch (error) {
      todayCompletions.value = previousCompletions
      habits.value = previousHabits
      handleError(error, 'errors.uncompleteHabit')
    }
  }

  const createHabit = async (payload: CreateHabitPayload): Promise<Habit | null> => {
    try {
      const habit = await api.post<Habit>('/habits', payload)
      habits.value = [...toValue(habits), habit]
      return habit
    } catch (error) {
      handleError(error, 'errors.createHabit')
      return null
    }
  }

  const createBatch = async (payloads: CreateHabitPayload[]): Promise<Habit[] | null> => {
    try {
      const created = await api.post<Habit[]>('/habits/batch', { habits: payloads })
      habits.value = [...toValue(habits), ...created]
      return created
    } catch (error) {
      handleError(error, 'errors.createHabit')
      return null
    }
  }

  const updateHabit = async (id: number, payload: Partial<CreateHabitPayload>): Promise<Habit | null> => {
    try {
      const updated = await api.patch<Habit>(`/habits/${id}`, payload)
      const idx = toValue(habits).findIndex((h) => h.id === id)
      if (idx !== -1) {
        habits.value[idx] = updated
      }
      return updated
    } catch (error) {
      handleError(error, 'errors.updateHabit')
      return null
    }
  }

  const deleteHabit = async (id: number): Promise<boolean> => {
    try {
      await api.del(`/habits/${id}`)
      habits.value = toValue(habits).filter((h) => h.id !== id)
      return true
    } catch (error) {
      handleError(error, 'errors.deleteHabit')
      return false
    }
  }

  return {
    habits,
    todayCompletions,
    isLoading,
    completedIds,
    totalToday,
    completedToday,
    progressPercent,
    groupedByTimeOfDay,
    isCompleted,
    fetchHabits,
    completeHabit,
    uncompleteHabit,
    createHabit,
    createBatch,
    updateHabit,
    deleteHabit,
  }
})
