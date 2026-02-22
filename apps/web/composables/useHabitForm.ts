import { z } from 'zod'
import type { CreateHabitPayload, TimeOfDay, HabitFrequency } from '~/types/habit'
import { TIMES_OF_DAY, HABIT_FREQUENCIES } from '~/types/habit'
import { HABIT_DEFAULTS, HABIT_VALIDATION } from '~/constants'

interface HabitFormErrors {
  name?: string
  description?: string
}

interface UseHabitFormOptions {
  initialData?: Partial<CreateHabitPayload>
}

interface UseHabitFormReturn {
  name: Ref<string>
  icon: Ref<string>
  timeOfDay: Ref<TimeOfDay>
  frequency: Ref<HabitFrequency>
  errors: Ref<HabitFormErrors>
  isValid: ComputedRef<boolean>
  validate: () => boolean
  getPayload: () => CreateHabitPayload
  reset: (data?: Partial<CreateHabitPayload>) => void
}

export const useHabitForm = (options: UseHabitFormOptions = {}): UseHabitFormReturn => {
  const { t } = useI18n()
  const { initialData } = options

  const schema = z.object({
    name: z
      .string()
      .min(1, t('validation.nameRequired'))
      .max(HABIT_VALIDATION.nameMaxLength, t('validation.maxChars', { max: HABIT_VALIDATION.nameMaxLength })),
    icon: z.string().default(HABIT_DEFAULTS.icon),
    timeOfDay: z.enum(TIMES_OF_DAY).default(HABIT_DEFAULTS.timeOfDay),
    frequency: z.enum(HABIT_FREQUENCIES).default(HABIT_DEFAULTS.frequency),
    description: z.string().max(HABIT_VALIDATION.descriptionMaxLength, t('validation.maxChars', { max: HABIT_VALIDATION.descriptionMaxLength })).optional(),
  })

  const name = ref<string>(initialData?.name ?? '')
  const icon = ref<string>(initialData?.icon ?? HABIT_DEFAULTS.icon)
  const timeOfDay = ref<TimeOfDay>(initialData?.timeOfDay ?? HABIT_DEFAULTS.timeOfDay)
  const frequency = ref<HabitFrequency>(initialData?.frequency ?? HABIT_DEFAULTS.frequency)
  const errors = ref<HabitFormErrors>({})

  const isValid = computed<boolean>(() => {
    const trimmed = toValue(name).trim()
    return trimmed.length > 0 && trimmed.length <= HABIT_VALIDATION.nameMaxLength
  })

  const validate = (): boolean => {
    const result = schema.safeParse({
      name: toValue(name),
      icon: toValue(icon),
      timeOfDay: toValue(timeOfDay),
      frequency: toValue(frequency),
    })

    if (!result.success) {
      const fieldErrors: HabitFormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof HabitFormErrors
        fieldErrors[field] = issue.message
      }
      errors.value = fieldErrors
      return false
    }

    errors.value = {}
    return true
  }

  const getPayload = (): CreateHabitPayload => ({
    name: toValue(name).trim(),
    icon: toValue(icon),
    timeOfDay: toValue(timeOfDay),
    frequency: toValue(frequency),
  })

  const reset = (data?: Partial<CreateHabitPayload>): void => {
    name.value = data?.name ?? ''
    icon.value = data?.icon ?? HABIT_DEFAULTS.icon
    timeOfDay.value = data?.timeOfDay ?? HABIT_DEFAULTS.timeOfDay
    frequency.value = data?.frequency ?? HABIT_DEFAULTS.frequency
    errors.value = {}
  }

  return {
    name,
    icon,
    timeOfDay,
    frequency,
    errors,
    isValid,
    validate,
    getPayload,
    reset,
  }
}
