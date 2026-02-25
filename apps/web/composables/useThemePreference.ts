type ThemePreference = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

interface UseThemePreferenceReturn {
  preference: Ref<ThemePreference>
  setPreference: (value: ThemePreference) => void
}

const applyTheme = (pref: ThemePreference): void => {
  const root = document.documentElement

  if (pref === 'light') {
    root.classList.remove('dark')
    return
  }

  if (pref === 'dark') {
    root.classList.add('dark')
    return
  }

  // auto — re-detect from Telegram theme or system preference
  const tgBgColor = root.style.getPropertyValue('--tg-theme-bg-color')
  if (tgBgColor) {
    const hex = tgBgColor.trim()
    if (hex.startsWith('#') && hex.length >= 7) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      root.classList.toggle('dark', luminance < 0.5)
      return
    }
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  root.classList.toggle('dark', !!prefersDark)
}

export const useThemePreference = (): UseThemePreferenceReturn => {
  const preference = ref<ThemePreference>('auto')

  onMounted(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
      if (stored === 'light' || stored === 'dark') {
        preference.value = stored
      }
    } catch {
      // localStorage unavailable
    }
  })

  const setPreference = (value: ThemePreference): void => {
    preference.value = value
    try {
      if (value === 'auto') {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, value)
      }
    } catch {
      // localStorage unavailable
    }
    applyTheme(value)
  }

  return { preference, setPreference }
}
