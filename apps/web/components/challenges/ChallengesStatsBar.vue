<script setup lang="ts">
const props = defineProps<{
  active: number
  completed: number
  total: number
}>()

const successRate = computed<number>(() => {
  const finished = props.completed + (props.total - props.active - props.completed)
  if (finished === 0) return 0
  return Math.round((props.completed / finished) * 100)
})
</script>

<template>
  <div class="flex items-center gap-3 text-xs text-muted-foreground">
    <span>
      <span class="font-semibold text-foreground">{{ active }}</span>
      {{ $t('challenges.statsActive') }}
    </span>
    <span class="text-foreground/20">·</span>
    <span>
      <span class="font-semibold text-foreground">{{ completed }}</span>
      {{ $t('challenges.statsCompleted') }}
    </span>
    <span class="text-foreground/20">·</span>
    <span>
      <span class="font-semibold text-foreground">{{ total }}</span>
      {{ $t('challenges.statsTotal') }}
    </span>
    <template v-if="total > active">
      <span class="text-foreground/20">·</span>
      <span>
        <span class="font-semibold" :class="successRate >= 75 ? 'text-green-500' : successRate >= 50 ? 'text-yellow-500' : 'text-foreground'">
          {{ successRate }}%
        </span>
        {{ $t('challenges.statsSuccessRate') }}
      </span>
    </template>
  </div>
</template>
