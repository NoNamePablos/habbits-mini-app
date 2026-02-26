import { useStorage } from '@vueuse/core'
import type { TimeOfDay } from '~/types/habit'

export const useFocusMode = () => {
  const focusMode = useStorage<boolean>('focusMode', false)

  const currentTimeOfDay = computed<TimeOfDay>(() => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    return 'evening'
  })

  return { focusMode, currentTimeOfDay }
}
