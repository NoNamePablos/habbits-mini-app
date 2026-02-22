import type { TelegramWebApp, TelegramUser, ColorScheme } from '~/types/telegram'
import type { HapticImpactStyle, HapticNotificationType } from '~/types/haptic'

interface UseTelegramReturn {
  tg: TelegramWebApp | undefined
  user: ComputedRef<TelegramUser | undefined>
  initData: ComputedRef<string | undefined>
  colorScheme: ComputedRef<ColorScheme>
  hapticImpact: (style?: HapticImpactStyle) => void
  hapticNotification: (type?: HapticNotificationType) => void
  showBackButton: (callback: () => void) => void
  hideBackButton: () => void
  showMainButton: (text: string, callback: () => void) => void
  hideMainButton: () => void
}

export const useTelegram = (): UseTelegramReturn => {
  const { $telegram } = useNuxtApp()
  const tg = $telegram as TelegramWebApp | undefined

  const user = computed((): TelegramUser | undefined => tg?.initDataUnsafe?.user)
  const initData = computed((): string | undefined => tg?.initData)
  const colorScheme = computed((): ColorScheme => tg?.colorScheme || 'light')

  const hapticImpact = (style: HapticImpactStyle = 'medium'): void => {
    tg?.HapticFeedback?.impactOccurred(style)
  }

  const hapticNotification = (type: HapticNotificationType = 'success'): void => {
    tg?.HapticFeedback?.notificationOccurred(type)
  }

  let activeBackButtonCb: (() => void) | null = null
  let activeMainButtonCb: (() => void) | null = null

  const showBackButton = (callback: () => void): void => {
    if (tg?.BackButton) {
      if (activeBackButtonCb) {
        tg.BackButton.offClick(activeBackButtonCb)
      }
      activeBackButtonCb = callback
      tg.BackButton.show()
      tg.BackButton.onClick(callback)
    }
  }

  const hideBackButton = (): void => {
    if (tg?.BackButton) {
      if (activeBackButtonCb) {
        tg.BackButton.offClick(activeBackButtonCb)
        activeBackButtonCb = null
      }
      tg.BackButton.hide()
    }
  }

  const showMainButton = (text: string, callback: () => void): void => {
    if (tg?.MainButton) {
      if (activeMainButtonCb) {
        tg.MainButton.offClick(activeMainButtonCb)
      }
      activeMainButtonCb = callback
      tg.MainButton.setText(text)
      tg.MainButton.show()
      tg.MainButton.onClick(callback)
    }
  }

  const hideMainButton = (): void => {
    if (tg?.MainButton) {
      if (activeMainButtonCb) {
        tg.MainButton.offClick(activeMainButtonCb)
        activeMainButtonCb = null
      }
      tg.MainButton.hide()
    }
  }

  return {
    tg,
    user,
    initData,
    colorScheme,
    hapticImpact,
    hapticNotification,
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,
  }
}
