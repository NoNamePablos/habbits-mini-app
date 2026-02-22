<script setup lang="ts">
import type { Habit, TimeOfDay } from '~/types/habit'
import { TIME_OF_DAY_ICONS } from '~/types/habit'

interface HabitGroup {
  key: TimeOfDay
  habits: Habit[]
}

interface Props {
  groups: HabitGroup[]
}

interface Emits {
  (e: 'toggle' | 'click', habitId: number): void
}

defineProps<Props>()
defineEmits<Emits>()

const habitsStore = useHabitsStore()
</script>

<template>
  <div class="space-y-4">
    <div v-for="group in groups" :key="group.key" class="space-y-2">
      <div class="flex items-center gap-2 px-1">
        <component :is="TIME_OF_DAY_ICONS[group.key]" class="h-4 w-4 text-muted-foreground" />
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {{ $t(`timeOfDay.${group.key}`) }}
        </span>
      </div>

      <div class="space-y-1.5">
        <HabitCard
          v-for="habit in group.habits"
          :key="habit.id"
          :habit="habit"
          :completed="habitsStore.isCompleted(habit.id)"
          @toggle="$emit('toggle', $event)"
          @click="$emit('click', $event)"
        />
      </div>
    </div>
  </div>
</template>
