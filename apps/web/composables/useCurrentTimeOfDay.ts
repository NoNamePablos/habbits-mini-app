import type { ComputedRef } from 'vue'
import type { TimeOfDay } from '~/types/habit'

type TimeOfDayStatus = 'past' | 'current' | 'future' | 'anytime'

interface UseCurrentTimeOfDayReturn {
  currentTimeOfDay: ComputedRef<TimeOfDay>
  getTimeOfDayStatus: (key: TimeOfDay) => TimeOfDayStatus
}

export const useCurrentTimeOfDay = (): UseCurrentTimeOfDayReturn => {
  const ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening']

  const currentTimeOfDay = computed<TimeOfDay>(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    return 'evening'
  })

  const getTimeOfDayStatus = (key: TimeOfDay): TimeOfDayStatus => {
    if (key === 'anytime') return 'anytime'

    const currentIdx = ORDER.indexOf(toValue(currentTimeOfDay))
    const keyIdx = ORDER.indexOf(key)

    if (keyIdx < currentIdx) return 'past'
    if (keyIdx === currentIdx) return 'current'
    return 'future'
  }

  return {
    currentTimeOfDay,
    getTimeOfDayStatus,
  }
}
