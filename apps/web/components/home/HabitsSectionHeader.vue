<script setup lang="ts">
import type { TimeOfDay } from '~/types/habit'
import { Zap } from 'lucide-vue-next'

const props = defineProps<{
  count: number
  filter: TimeOfDay | 'all'
  focusMode: boolean
}>()

const emit = defineEmits<{
  'update:filter': [value: TimeOfDay | 'all']
  'toggle:focusMode': []
}>()

// useFocusMode is auto-imported by Nuxt from composables/
const { currentTimeOfDay } = useFocusMode()

const onFilterChange = (val: unknown): void => {
  emit('update:filter', val as TimeOfDay | 'all')
}
</script>

<template>
  <div class="flex items-center justify-between mb-3">
    <div>
      <h2 class="text-base font-bold">{{ $t('home.myHabits') }}</h2>
      <p class="text-[11px] text-muted-foreground">
        {{ $t('home.habitsForToday', { count: props.count }) }}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 shrink-0"
        :class="focusMode ? 'text-primary bg-primary/10' : 'text-muted-foreground'"
        :title="$t('home.focusMode')"
        @click="emit('toggle:focusMode')"
      >
        <Zap class="h-4 w-4" :class="focusMode ? 'fill-primary' : ''" />
      </Button>
      <Select
        v-if="!focusMode"
        :model-value="props.filter"
        @update:model-value="onFilterChange"
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
      <span
        v-else
        class="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full"
      >
        {{ $t(`timeOfDay.${currentTimeOfDay}`) }}
      </span>
    </div>
  </div>
</template>
