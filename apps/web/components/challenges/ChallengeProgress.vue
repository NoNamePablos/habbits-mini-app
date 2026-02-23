<script setup lang="ts">
interface Props {
  percent: number
  size?: number
  strokeWidth?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 120,
  strokeWidth: 8,
  color: '#8774e1',
})

const radius = computed<number>(() => (props.size - props.strokeWidth) / 2)
const circumference = computed<number>(() => 2 * Math.PI * toValue(radius))
const dashOffset = computed<number>(() => toValue(circumference) * (1 - props.percent / 100))
</script>

<template>
  <div class="relative inline-flex items-center justify-center">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        class="text-secondary/30"
        stroke="currentColor"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        :stroke="color"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="transition-all duration-700 ease-out"
      />
    </svg>
    <div class="absolute inset-0 flex items-center justify-center">
      <slot />
    </div>
  </div>
</template>
