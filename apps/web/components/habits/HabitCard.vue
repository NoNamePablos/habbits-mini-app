<script setup lang="ts">
import type { Component } from 'vue'
import type { Habit } from '~/types/habit'
import { Check, Flame } from 'lucide-vue-next'
import { STREAK_BADGE_THRESHOLD } from '~/constants'

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

const habitIcon = computed<Component>(() => resolveIcon(props.habit.icon))

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
</script>

<template>
  <div
    class="flex items-center gap-3 p-3 rounded-2xl glass transition-all active:scale-[0.98]"
    :class="{ 'opacity-60': completed }"
    @click="onClick"
  >
    <Button
      variant="outline"
      size="icon"
      class="shrink-0 w-10 h-10 rounded-full transition-all"
      :class="[
        completed
          ? 'bg-gradient-primary border-transparent text-white hover:opacity-90'
          : 'border-white/20 dark:border-white/10 bg-transparent',
      ]"
      @click.stop="onToggle"
    >
      <Check v-if="completed" class="h-4 w-4" />
      <component :is="habitIcon" v-else class="h-4 w-4" />
    </Button>

    <div class="flex-1 min-w-0">
      <div
        class="font-medium text-sm truncate"
        :class="{ 'line-through text-muted-foreground': completed }"
      >
        {{ habit.name }}
      </div>
      <div v-if="habit.currentStreak > 0" class="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
        <Flame class="h-3 w-3 text-orange-500 icon-glow" />
        <span>{{ $t('habitCard.streakDays', { count: habit.currentStreak }) }}</span>
      </div>
    </div>

    <Badge v-if="habit.currentStreak >= STREAK_BADGE_THRESHOLD" variant="secondary" class="shrink-0 text-[10px] gap-1">
      {{ habit.currentStreak }}
      <Flame class="h-3 w-3 text-orange-500" />
    </Badge>
  </div>
</template>
