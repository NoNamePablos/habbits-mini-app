import type { TelegramWebApp, TelegramUser } from '~/types/telegram'

/**
 * Reconstruct initData from window.location.hash.
 *
 * Telegram WebApp SDK v9+ places initData parameters directly in the URL
 * hash fragment (e.g. #tgWebAppData=user={...}&auth_date=123&hash=abc...),
 * but the SDK parser sometimes fails to reconstruct the full initData string
 * because the unencoded `&` chars act as hash-level separators.
 */
const extractInitDataFromHash = (): string => {
  const hash = window.location.hash.slice(1)
  if (!hash) return ''

  const parts = hash.split('&')
  const initDataParts: string[] = []

  for (const part of parts) {
    const eqIdx = part.indexOf('=')
    const key = eqIdx === -1 ? part : part.substring(0, eqIdx)

    if (key === 'tgWebAppData') {
      const value = eqIdx === -1 ? '' : part.substring(eqIdx + 1)
      if (value) initDataParts.push(value)
    } else if (!key.startsWith('tgWebApp')) {
      initDataParts.push(part)
    }
  }

  return initDataParts.join('&')
}

/**
 * Extract tgWebAppThemeParams from the URL hash and apply as CSS variables.
 * The SDK's hash parser may fail to extract theme params for the same reason
 * initData fails — unencoded & in the hash fragment.
 */
const applyThemeFromHash = (): Record<string, string> | undefined => {
  const hash = window.location.hash.slice(1)
  if (!hash) return undefined

  const parts = hash.split('&')
  for (const part of parts) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    const key = part.substring(0, eqIdx)
    if (key === 'tgWebAppThemeParams') {
      const raw = decodeURIComponent(part.substring(eqIdx + 1))
      try {
        const theme = JSON.parse(raw) as Record<string, string>
        const root = document.documentElement
        for (const [param, value] of Object.entries(theme)) {
          // bg_color → --tg-theme-bg-color
          const cssVar = `--tg-theme-${param.replace(/_/g, '-')}`
          root.style.setProperty(cssVar, value)
        }
        return theme
      } catch { /* ignore parse errors */ }
      break
    }
  }
  return undefined
}

/**
 * Determine if a hex color is "dark" using relative luminance.
 */
const isDarkColor = (hex: string): boolean => {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

const parseUserFromInitData = (initData: string): TelegramUser | undefined => {
  try {
    const params = new URLSearchParams(initData)
    const userRaw = params.get('user')
    if (userRaw) return JSON.parse(userRaw) as TelegramUser
  } catch { /* ignore */ }
  return undefined
}

export default defineNuxtPlugin((): { provide: { telegram: TelegramWebApp | undefined; telegramInitData: string; telegramUser: TelegramUser | undefined } } => {
  const tg = window.Telegram?.WebApp

  // Ensure theme CSS variables are set (SDK may fail to parse them from hash)
  const themeParams = applyThemeFromHash()

  // Resolve initData: use SDK value if valid, otherwise reconstruct from hash
  let initData = tg?.initData || ''
  if (!initData.includes('hash=')) {
    const extracted = extractInitDataFromHash()
    if (extracted.includes('hash=')) {
      initData = extracted
    }
  }

  // Resolve user: use SDK value if available, otherwise parse from initData
  let user = tg?.initDataUnsafe?.user ?? undefined
  if (!user && initData) {
    user = parseUserFromInitData(initData)
  }

  // Detect dark mode: prefer theme bg_color luminance (SDK colorScheme is broken)
  const bgColor = themeParams?.bg_color || tg?.themeParams?.bg_color
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  const detectedDark = bgColor ? isDarkColor(bgColor) : (prefersDark || tg?.colorScheme === 'dark')

  if (detectedDark) {
    document.documentElement.classList.add('dark')
  }

  if (tg) {
    tg.ready()
    tg.expand()
    tg.enableClosingConfirmation()

    tg.onEvent('themeChanged', () => {
      const newBg = tg.themeParams?.bg_color
      const dark = newBg ? isDarkColor(newBg) : tg.colorScheme === 'dark'
      document.documentElement.classList.toggle('dark', dark)
    })

    const languageCode = user?.language_code
    if (languageCode) {
      const i18n = useNuxtApp().$i18n as { locale: { value: string } }
      i18n.locale.value = languageCode === 'ru' ? 'ru' : 'en'
    }
  }

  return {
    provide: {
      telegram: tg,
      telegramInitData: initData,
      telegramUser: user,
    },
  }
})
