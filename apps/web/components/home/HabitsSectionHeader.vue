<script setup lang="ts">
import type { TimeOfDay } from '~/types/habit'

defineProps<{
  count: number
  filter: TimeOfDay | 'all'
}>()

defineEmits<{
  'update:filter': [value: TimeOfDay | 'all']
}>()
</script>

<template>
  <div class="flex items-center justify-between mb-3">
    <div>
      <h2 class="text-base font-bold">{{ $t('home.myHabits') }}</h2>
      <p class="text-[11px] text-muted-foreground">
        {{ $t('home.habitsForToday', { count }) }}
      </p>
    </div>
    <Select
      :model-value="filter"
      @update:model-value="$emit('update:filter', $event as TimeOfDay | 'all')"
    >
      <SelectTrigger class="h-8 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{{ $t('home.filterAll') }}</SelectItem>
        <SelectItem value="morning">{{ $t('timeOfDay.morning') }}</SelectItem>
        <SelectItem value="afternoon">{{ $t('timeOfDay.afternoon') }}</SelectItem>
        <SelectItem value="evening">{{ $t('timeOfDay.evening') }}</SelectItem>
        <SelectItem value="anytime">{{ $t('timeOfDay.anytime') }}</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
