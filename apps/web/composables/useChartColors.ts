import { CHART_COLOR_FALLBACKS, HEATMAP_SHADE_OPACITIES } from '~/constants'

interface UseChartColorsReturn {
  primary: Ref<string>
  muted: Ref<string>
  mutedForeground: Ref<string>
  cardBg: Ref<string>
  isDark: Ref<boolean>
  primaryShades: ComputedRef<string[]>
}

/**
 * Resolve a CSS custom property to a concrete color value.
 * Uses a temporary DOM element so that color-mix(), var() chains, etc.
 * are fully computed by the browser engine.
 */
const resolveColor = (varName: string, fallback: string): string => {
  if (typeof document === 'undefined') return fallback
  const el = document.createElement('div')
  el.style.display = 'none'
  el.style.color = `var(${varName}, ${fallback})`
  document.body.appendChild(el)
  const computed = getComputedStyle(el).color
  el.remove()
  return computed || fallback
}

/**
 * Convert any CSS color string (hex or rgb()) to rgba with given alpha.
 */
const toRgba = (color: string, alpha: number): string => {
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`
  }
  if (color.startsWith('#') && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return color
}

export const useChartColors = (): UseChartColorsReturn => {
  const primary = ref<string>(CHART_COLOR_FALLBACKS.primary)
  const muted = ref<string>(CHART_COLOR_FALLBACKS.muted)
  const mutedForeground = ref<string>(CHART_COLOR_FALLBACKS.mutedForeground)
  const cardBg = ref<string>('#1a1a2e')
  const isDark = ref<boolean>(true)

  const updateColors = (): void => {
    primary.value = resolveColor('--color-primary', CHART_COLOR_FALLBACKS.primary)
    muted.value = resolveColor('--color-muted', CHART_COLOR_FALLBACKS.muted)
    mutedForeground.value = resolveColor('--color-muted-foreground', CHART_COLOR_FALLBACKS.mutedForeground)
    cardBg.value = resolveColor('--color-card', '#1a1a2e')
    if (typeof document !== 'undefined') {
      isDark.value = document.documentElement.classList.contains('dark')
    }
  }

  onMounted(() => {
    updateColors()
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.onEvent('themeChanged', updateColors)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.offEvent('themeChanged', updateColors)
    }
  })

  const primaryShades = computed<string[]>(() => {
    const p = toValue(primary)
    const emptyCellColor = toValue(isDark)
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.06)'
    return [
      emptyCellColor,
      ...HEATMAP_SHADE_OPACITIES.map((opacity) => toRgba(p, opacity)),
      p,
    ]
  })

  return { primary, muted, mutedForeground, cardBg, isDark, primaryShades }
}
