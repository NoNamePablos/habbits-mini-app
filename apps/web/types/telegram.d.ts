import type { HapticImpactStyle, HapticNotificationType } from './haptic'

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface TelegramHapticFeedback {
  impactOccurred: (style: HapticImpactStyle) => void
  notificationOccurred: (type: HapticNotificationType) => void
  selectionChanged: () => void
}

export interface TelegramButton {
  show: () => void
  hide: () => void
  onClick: (callback: () => void) => void
  offClick: (callback: () => void) => void
  setText?: (text: string) => void
  isVisible: boolean
}

export interface TelegramMainButton extends TelegramButton {
  setText: (text: string) => void
  showProgress: (leaveActive?: boolean) => void
  hideProgress: () => void
  color: string
  textColor: string
}

export type ColorScheme = 'light' | 'dark'

export interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    auth_date?: number
    hash?: string
    query_id?: string
    start_param?: string
  }
  colorScheme: ColorScheme
  themeParams: Record<string, string>
  viewportHeight: number
  viewportStableHeight: number
  isExpanded: boolean
  platform: string
  HapticFeedback: TelegramHapticFeedback
  BackButton: TelegramButton
  MainButton: TelegramMainButton
  SettingsButton: TelegramButton
  onEvent: (eventType: string, callback: () => void) => void
  offEvent: (eventType: string, callback: () => void) => void
  openLink: (url: string) => void
  setHeaderColor: (color: string) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}
