<script setup lang="ts">
import type { Component } from 'vue'
import type { Habit } from '~/types/habit'
import { Check, Flame } from 'lucide-vue-next'

interface Props {
  habit: Habit
  completed: boolean
}

interface Emits {
  (e: 'toggle' | 'click', habitId: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { hapticImpact, hapticNotification } = useTelegram()
const { resolveIcon } = useHabitIcon()
const { t } = useI18n()

const habitIcon = computed<Component>(() => resolveIcon(props.habit.icon))
const habitColor = computed<string>(() => props.habit.color ?? 'var(--primary)')

const isJustCompleted = ref<boolean>(false)

watch(() => props.completed, (val, old) => {
  if (val && !old) {
    isJustCompleted.value = true
    setTimeout(() => { isJustCompleted.value = false }, 600)
  }
})

const onToggle = (): void => {
  if (!props.completed) {
    hapticNotification('success')
  } else {
    hapticImpact('light')
  }
  emit('toggle', props.habit.id)
}

const onClick = (): void => {
  emit('click', props.habit.id)
}

const frequencyLabel = computed<string>(() => t(`frequency.${props.habit.frequency}`))
const timeLabel = computed<string>(() => t(`timeOfDay.${props.habit.timeOfDay}`))
</script>

<template>
  <div
    class="flex items-center gap-3 p-3 rounded-2xl glass transition-all active:scale-[0.98] border-l-[3px]"
    :class="{ 'animate-row-flash': isJustCompleted }"
    :style="{ borderLeftColor: habitColor }"
    @click="onClick"
  >
    <!-- Icon -->
    <div
      class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
      :style="{ backgroundColor: `${habitColor}25` }"
    >
      <component :is="habitIcon" class="h-4 w-4" :style="{ color: habitColor }" />
    </div>

    <!-- Name + tags -->
    <div class="flex-1 min-w-0">
      <div
        class="font-medium text-sm truncate"
        :class="{ 'text-muted-foreground': completed }"
      >
        {{ habit.name }}
      </div>
      <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
        <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/8 text-muted-foreground font-medium">
          🔥 {{ frequencyLabel }}
        </span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/8 text-muted-foreground font-medium">
          ⏰ {{ timeLabel }}
        </span>
        <span
          v-if="habit.currentStreak > 0"
          class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
          :style="{ backgroundColor: `${habitColor}20`, color: habitColor }"
        >
          <Flame class="h-2.5 w-2.5 inline -mt-px" /> {{ habit.currentStreak }}
        </span>
      </div>
    </div>

    <!-- Completion button -->
    <button
      class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all border-2"
      :class="[
        completed ? 'border-transparent text-white' : 'bg-transparent',
        { 'animate-habit-complete': isJustCompleted },
      ]"
      :style="completed
        ? { backgroundColor: habitColor, borderColor: habitColor }
        : { borderColor: `${habitColor}60` }"
      @click.stop="onToggle"
    >
      <Check v-if="completed" class="h-4 w-4" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
@keyframes habit-complete {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.2); }
  60%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}

@keyframes row-flash {
  0%   { background-color: transparent; }
  25%  { background-color: rgba(34, 197, 94, 0.12); }
  100% { background-color: transparent; }
}

.animate-habit-complete {
  animation: habit-complete 0.4s ease-out;
}

.animate-row-flash {
  animation: row-flash 0.5s ease-out;
}
</style>
