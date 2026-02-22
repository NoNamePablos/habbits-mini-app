import { CHART_COLOR_FALLBACKS, HEATMAP_SHADE_OPACITIES } from '~/constants'

interface UseChartColorsReturn {
  primary: Ref<string>
  muted: Ref<string>
  mutedForeground: Ref<string>
  primaryShades: ComputedRef<string[]>
}

const resolveColor = (varName: string, fallback: string): string => {
  if (typeof document === 'undefined') return fallback
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return val || fallback
}

const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex.startsWith('#') || hex.length < 7) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const useChartColors = (): UseChartColorsReturn => {
  const primary = ref<string>(CHART_COLOR_FALLBACKS.primary)
  const muted = ref<string>(CHART_COLOR_FALLBACKS.muted)
  const mutedForeground = ref<string>(CHART_COLOR_FALLBACKS.mutedForeground)

  const updateColors = (): void => {
    primary.value = resolveColor('--color-primary', CHART_COLOR_FALLBACKS.primary)
    muted.value = resolveColor('--color-muted', CHART_COLOR_FALLBACKS.muted)
    mutedForeground.value = resolveColor('--color-muted-foreground', CHART_COLOR_FALLBACKS.mutedForeground)
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
    return [
      toValue(muted),
      ...HEATMAP_SHADE_OPACITIES.map((opacity) => hexToRgba(p, opacity)),
      p,
    ]
  })

  return { primary, muted, mutedForeground, primaryShades }
}
