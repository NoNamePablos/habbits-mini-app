import { toast } from 'vue-sonner'

interface UseErrorHandlerReturn {
  handleError: (error: unknown, fallbackMessageKey: string) => void
  showSuccess: (messageKey: string, params?: Record<string, unknown>) => void
  showInfo: (messageKey: string, params?: Record<string, unknown>) => void
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const nuxtApp = useNuxtApp()

  const t = (key: string, params?: Record<string, unknown>): string => {
    const i18n = nuxtApp.$i18n as { t: (key: string, params?: Record<string, unknown>) => string }
    return i18n.t(key, params)
  }

  const extractMessage = (error: unknown): string | null => {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    return null
  }

  const handleError = (error: unknown, fallbackKey: string): void => {
    const message = extractMessage(error) ?? t(fallbackKey)
    console.error(`[${fallbackKey}]`, error)
    toast.error(message)
  }

  const showSuccess = (messageKey: string, params?: Record<string, unknown>): void => {
    toast.success(t(messageKey, params))
  }

  const showInfo = (messageKey: string, params?: Record<string, unknown>): void => {
    toast.info(t(messageKey, params))
  }

  return { handleError, showSuccess, showInfo }
}
