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

const dragOverId = ref<number | null>(null)
const draggingId = ref<number | null>(null)

const onDragStart = (habitId: number, event: DragEvent): void => {
  draggingId.value = habitId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(habitId))
  }
}

const onDragOver = (habitId: number, event: DragEvent): void => {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dragOverId.value = habitId
}

const onDrop = (targetHabitId: number, group: HabitGroup): void => {
  const sourceId = toValue(draggingId)
  if (!sourceId || sourceId === targetHabitId) {
    dragOverId.value = null
    draggingId.value = null
    return
  }

  const allHabits = toValue(habitsStore.habits)
  const groupIds = group.habits.map((h) => h.id)
  const sourceIdx = groupIds.indexOf(sourceId)
  const targetIdx = groupIds.indexOf(targetHabitId)

  if (sourceIdx === -1 || targetIdx === -1) {
    dragOverId.value = null
    draggingId.value = null
    return
  }

  const reordered = [...groupIds]
  reordered.splice(sourceIdx, 1)
  reordered.splice(targetIdx, 0, sourceId)

  // Non-group habits keep their relative positions appended after
  const otherIds = allHabits.filter((h) => !groupIds.includes(h.id)).map((h) => h.id)
  habitsStore.reorderHabits([...reordered, ...otherIds])

  dragOverId.value = null
  draggingId.value = null
}

const onDragEnd = (): void => {
  dragOverId.value = null
  draggingId.value = null
}
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
        <div
          v-for="(habit, index) in group.habits"
          :key="habit.id"
          draggable="true"
          class="transition-all duration-150"
          :class="[
            draggingId === habit.id ? 'opacity-40 scale-[0.98]' : '',
            dragOverId === habit.id && draggingId !== habit.id
              ? 'translate-y-0.5 ring-2 ring-primary/40 rounded-xl' : '',
          ]"
          @dragstart="onDragStart(habit.id, $event)"
          @dragover="onDragOver(habit.id, $event)"
          @drop="onDrop(habit.id, group)"
          @dragend="onDragEnd"
        >
          <HabitsHabitCard
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
  </div>
</template>
