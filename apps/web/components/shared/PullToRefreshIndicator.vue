<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  pullDistance: number
  isRefreshing: boolean
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 60,
})

const progress = computed<number>(() =>
  Math.min(props.pullDistance / props.threshold, 1),
)

const rotation = computed<number>(() => toValue(progress) * 360)
</script>

<template>
  <div
    class="flex items-center justify-center overflow-hidden transition-[height] duration-200"
    :style="{ height: `${pullDistance}px` }"
  >
    <div
      v-if="pullDistance > 10"
      class="transition-opacity duration-150"
      :class="isRefreshing ? 'animate-spin' : ''"
      :style="{
        opacity: progress,
        transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
      }"
    >
      <Loader2 class="h-5 w-5 text-primary/60" />
    </div>
  </div>
</template>
