import { z } from 'zod'
import type { CreateChallengePayload } from '~/types/challenge'
import { CHALLENGE_DEFAULTS, CHALLENGE_VALIDATION } from '~/constants'

interface ChallengeFormErrors {
  title?: string
  description?: string
  durationDays?: string
}

interface UseChallengeFormOptions {
  initialData?: Partial<CreateChallengePayload>
}

interface UseChallengeFormReturn {
  title: Ref<string>
  description: Ref<string>
  icon: Ref<string>
  color: Ref<string>
  durationDays: Ref<number>
  allowedMisses: Ref<number>
  startDate: Ref<string>
  errors: Ref<ChallengeFormErrors>
  isValid: ComputedRef<boolean>
  validate: () => boolean
  getPayload: () => CreateChallengePayload
  reset: (data?: Partial<CreateChallengePayload>) => void
}

const getTodayDate = (): string => {
  return new Intl.DateTimeFormat('en-CA').format(new Date())
}

export const useChallengeForm = (options: UseChallengeFormOptions = {}): UseChallengeFormReturn => {
  const { t } = useI18n()
  const { initialData } = options

  const schema = z.object({
    title: z
      .string()
      .min(1, t('validation.nameRequired'))
      .max(CHALLENGE_VALIDATION.titleMaxLength, t('validation.maxChars', { max: CHALLENGE_VALIDATION.titleMaxLength })),
    description: z
      .string()
      .max(CHALLENGE_VALIDATION.descriptionMaxLength, t('validation.maxChars', { max: CHALLENGE_VALIDATION.descriptionMaxLength }))
      .optional(),
    icon: z.string().default(CHALLENGE_DEFAULTS.icon),
    color: z.string().default(CHALLENGE_DEFAULTS.color),
    durationDays: z.number().int().min(CHALLENGE_VALIDATION.minDuration).max(CHALLENGE_VALIDATION.maxDuration),
    allowedMisses: z.number().int().min(0).max(10).default(CHALLENGE_DEFAULTS.allowedMisses),
    startDate: z.string(),
  })

  const title = ref<string>(initialData?.title ?? '')
  const description = ref<string>(initialData?.description ?? '')
  const icon = ref<string>(initialData?.icon ?? CHALLENGE_DEFAULTS.icon)
  const color = ref<string>(initialData?.color ?? CHALLENGE_DEFAULTS.color)
  const durationDays = ref<number>(initialData?.durationDays ?? CHALLENGE_DEFAULTS.durationDays)
  const allowedMisses = ref<number>(initialData?.allowedMisses ?? CHALLENGE_DEFAULTS.allowedMisses)
  const startDate = ref<string>(initialData?.startDate ?? getTodayDate())
  const errors = ref<ChallengeFormErrors>({})

  const isValid = computed<boolean>(() => {
    const trimmed = toValue(title).trim()
    return trimmed.length > 0 && trimmed.length <= CHALLENGE_VALIDATION.titleMaxLength && toValue(durationDays) > 0
  })

  const validate = (): boolean => {
    const result = schema.safeParse({
      title: toValue(title),
      description: toValue(description) || undefined,
      icon: toValue(icon),
      color: toValue(color),
      durationDays: toValue(durationDays),
      allowedMisses: toValue(allowedMisses),
      startDate: toValue(startDate),
    })

    if (!result.success) {
      const fieldErrors: ChallengeFormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ChallengeFormErrors
        fieldErrors[field] = issue.message
      }
      errors.value = fieldErrors
      return false
    }

    errors.value = {}
    return true
  }

  const getPayload = (): CreateChallengePayload => ({
    title: toValue(title).trim(),
    description: toValue(description).trim() || undefined,
    icon: toValue(icon),
    color: toValue(color),
    durationDays: toValue(durationDays),
    allowedMisses: toValue(allowedMisses),
    startDate: toValue(startDate),
  })

  const reset = (data?: Partial<CreateChallengePayload>): void => {
    title.value = data?.title ?? ''
    description.value = data?.description ?? ''
    icon.value = data?.icon ?? CHALLENGE_DEFAULTS.icon
    color.value = data?.color ?? CHALLENGE_DEFAULTS.color
    durationDays.value = data?.durationDays ?? CHALLENGE_DEFAULTS.durationDays
    allowedMisses.value = data?.allowedMisses ?? CHALLENGE_DEFAULTS.allowedMisses
    startDate.value = data?.startDate ?? getTodayDate()
    errors.value = {}
  }

  return {
    title,
    description,
    icon,
    color,
    durationDays,
    allowedMisses,
    startDate,
    errors,
    isValid,
    validate,
    getPayload,
    reset,
  }
}
