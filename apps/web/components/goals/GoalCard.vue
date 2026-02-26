<script setup lang="ts">
import { Target, Flame, Zap, CheckCircle, Plus, X } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { GoalWithProgress, GoalType } from '~/types/goal'

interface Props {
  activeGoal: GoalWithProgress | null
}

interface Emits {
  (e: 'create'): void
  (e: 'abandon', goalId: number): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

const GOAL_TYPE_ICONS: Record<GoalType, Component> = {
  completion_rate: Target,
  streak_days: Flame,
  total_xp: Zap,
  total_completions: CheckCircle,
}

const GOAL_TYPE_COLORS: Record<GoalType, string> = {
  completion_rate: 'text-primary',
  streak_days: 'text-orange-500',
  total_xp: 'text-yellow-500',
  total_completions: 'text-green-500',
}

const GOAL_TYPE_BG: Record<GoalType, string> = {
  completion_rate: 'bg-primary/15',
  streak_days: 'bg-orange-500/15',
  total_xp: 'bg-yellow-500/15',
  total_completions: 'bg-green-500/15',
}

const getDaysLeft = (deadline: string): number => {
  const now = new Date()
  const end = new Date(deadline)
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000))
}

const getTrackStatus = (goal: import('~/types/goal').Goal, progressPercent: number): 'on-track' | 'behind' | null => {
  const now = new Date()
  const start = new Date(goal.startDate)
  const end = new Date(goal.deadline)
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
  const daysPassed = Math.ceil((now.getTime() - start.getTime()) / 86400000)
  if (daysPassed <= 0) return null
  const expectedProgress = Math.min(100, (daysPassed / totalDays) * 100)
  return progressPercent >= expectedProgress - 10 ? 'on-track' : 'behind'
}

const formatValue = (type: GoalType, value: number): string => {
  if (type === 'completion_rate') return `${value}%`
  return String(value)
}
</script>

<template>
  <Card v-if="activeGoal" class="glass overflow-hidden animate-fade-in-up">
    <CardContent class="pt-3 pb-3">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          :class="GOAL_TYPE_BG[activeGoal.goal.type]"
        >
          <component
            :is="GOAL_TYPE_ICONS[activeGoal.goal.type]"
            class="h-4.5 w-4.5"
            :class="GOAL_TYPE_COLORS[activeGoal.goal.type]"
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-0.5">
            <span class="text-xs font-semibold truncate">
              {{ $t(`goals.typeDescription.${activeGoal.goal.type}`, { target: activeGoal.goal.targetValue }) }}
            </span>
            <span
              v-if="getTrackStatus(activeGoal.goal, activeGoal.progressPercent)"
              class="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1"
              :class="getTrackStatus(activeGoal.goal, activeGoal.progressPercent) === 'on-track'
                ? 'bg-green-500/15 text-green-500'
                : 'bg-amber-500/15 text-amber-500'"
            >
              {{ getTrackStatus(activeGoal.goal, activeGoal.progressPercent) === 'on-track'
                ? $t('goals.onTrack') : $t('goals.behind') }}
            </span>
            <button
              class="text-muted-foreground hover:text-destructive transition-colors p-0.5 -mr-0.5 shrink-0"
              @click="$emit('abandon', activeGoal.goal.id)"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs text-muted-foreground">
              {{ formatValue(activeGoal.goal.type, activeGoal.currentValue) }}/{{ formatValue(activeGoal.goal.type, activeGoal.goal.targetValue) }}
            </span>
            <span class="text-[10px] text-muted-foreground ml-auto">
              {{ $t('goals.daysLeft', { count: getDaysLeft(activeGoal.goal.deadline) }) }}
            </span>
          </div>
          <div class="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-primary rounded-full transition-all duration-500"
              :style="{ width: `${activeGoal.progressPercent}%` }"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  <button
    v-else
    class="w-full glass rounded-xl p-3 flex items-center gap-3 transition-colors hover:bg-foreground/5 animate-fade-in-up"
    @click="$emit('create')"
  >
    <div class="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
      <Plus class="h-4.5 w-4.5 text-primary" />
    </div>
    <div class="text-left">
      <div class="text-xs font-semibold">{{ $t('goals.setGoal') }}</div>
      <div class="text-[10px] text-muted-foreground">{{ $t('goals.noActiveGoal') }}</div>
    </div>
  </button>
</template>
