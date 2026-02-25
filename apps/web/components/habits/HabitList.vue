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
const { getTimeOfDayStatus } = useCurrentTimeOfDay()
const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="group in groups"
      :key="group.key"
      class="space-y-2 transition-opacity duration-300"
      :class="{ 'opacity-50': getTimeOfDayStatus(group.key) === 'past' }"
    >
      <div class="flex items-center gap-2 px-1">
        <component
          :is="TIME_OF_DAY_ICONS[group.key]"
          class="h-4 w-4"
          :class="[
            getTimeOfDayStatus(group.key) === 'current'
              ? 'text-primary'
              : 'text-muted-foreground',
          ]"
        />
        <span
          class="text-xs font-medium uppercase tracking-wide"
          :class="[
            getTimeOfDayStatus(group.key) === 'current'
              ? 'text-primary'
              : 'text-muted-foreground',
          ]"
        >
          {{ $t(`timeOfDay.${group.key}`) }}
        </span>
        <Badge
          v-if="getTimeOfDayStatus(group.key) === 'current'"
          variant="secondary"
          class="text-[9px] px-1.5 py-0 bg-primary/15 text-primary border-0"
        >
          {{ t('timeOfDay.now') }}
        </Badge>
      </div>

      <div class="space-y-1.5">
        <HabitsHabitCard
          v-for="(habit, index) in group.habits"
          :key="habit.id"
          :habit="habit"
          :completed="habitsStore.isCompleted(habit.id)"
          class="stagger-item"
          :style="{ '--stagger': index }"
          @toggle="$emit('toggle', $event)"
          @click="$emit('click', $event)"
        />
      </div>
    </div>
  </div>
</template>
