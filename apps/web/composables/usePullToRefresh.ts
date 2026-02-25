interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  maxPull?: number
}

interface UsePullToRefreshReturn {
  containerRef: Ref<HTMLElement | null>
  pullDistance: Readonly<Ref<number>>
  isRefreshing: Readonly<Ref<boolean>>
}

export const usePullToRefresh = (options: UsePullToRefreshOptions): UsePullToRefreshReturn => {
  const { onRefresh, threshold = 60, maxPull = 100 } = options

  const containerRef = ref<HTMLElement | null>(null)
  const pullDistance = ref<number>(0)
  const isRefreshing = ref<boolean>(false)
  const isPulling = ref<boolean>(false)

  let startY = 0

  const getScrollTop = (): number => {
    const el = toValue(containerRef)
    if (!el) return 0
    const scrollParent = el.closest('main')
    return scrollParent?.scrollTop ?? 0
  }

  const onTouchStart = (e: TouchEvent): void => {
    if (toValue(isRefreshing)) return
    if (getScrollTop() > 0) return
    startY = e.touches[0].clientY
    isPulling.value = true
  }

  const onTouchMove = (e: TouchEvent): void => {
    if (!toValue(isPulling) || toValue(isRefreshing)) return
    if (getScrollTop() > 0) {
      isPulling.value = false
      pullDistance.value = 0
      return
    }

    const delta = e.touches[0].clientY - startY
    if (delta > 0) {
      pullDistance.value = Math.min(delta * 0.5, maxPull)
    }
  }

  const onTouchEnd = async (): Promise<void> => {
    if (!toValue(isPulling)) return
    isPulling.value = false

    if (toValue(pullDistance) >= threshold) {
      isRefreshing.value = true
      pullDistance.value = threshold

      try {
        await onRefresh()
      } finally {
        isRefreshing.value = false
        pullDistance.value = 0
      }
    } else {
      pullDistance.value = 0
    }
  }

  onMounted(() => {
    const el = toValue(containerRef)
    if (!el) return
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
  })

  onUnmounted(() => {
    const el = toValue(containerRef)
    if (!el) return
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
  })

  return {
    containerRef,
    pullDistance: readonly(pullDistance),
    isRefreshing: readonly(isRefreshing),
  }
}
