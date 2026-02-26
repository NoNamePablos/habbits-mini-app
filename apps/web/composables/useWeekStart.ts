import { useStorage } from '@vueuse/core'

export const useWeekStart = () => {
  const startsMonday = useStorage<boolean>('weekStartsMonday', true)
  return { startsMonday }
}
