<script setup lang="ts">
defineProps<{
  active: number
  completed: number
  total: number
}>()
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
  </div>
</template>
