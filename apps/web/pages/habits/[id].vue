<script setup lang="ts">
import type { Component } from 'vue'
import type { Habit, CreateHabitPayload } from '~/types/habit'
import type { HabitStats } from '~/types/stats'
import { TIME_OF_DAY_ICONS } from '~/types/habit'
import { ArrowLeft, Check, Flame, Trophy, Pencil, Trash2, BarChart3, Calendar } from 'lucide-vue-next'

const route = useRoute()
const habitsStore = useHabitsStore()
const statsStore = useStatsStore()
const { hapticNotification, hapticImpact } = useTelegram()
const { resolveIcon } = useHabitIcon()
const { showSuccess } = useErrorHandler()

const habit = ref<Habit | null>(null)
const habitStats = ref<HabitStats | null>(null)
const isLoading = ref<boolean>(true)
const showEditForm = ref<boolean>(false)
const showDeleteConfirm = ref<boolean>(false)

const habitId = computed<number>(() => Number(route.params.id))

const habitIcon = computed<Component>(() => resolveIcon(toValue(habit)?.icon ?? null))

const isCompleted = computed<boolean>(() => habitsStore.isCompleted(toValue(habitId)))

const fetchHabit = async (): Promise<void> => {
  isLoading.value = true
  try {
    const api = useApi()
    habit.value = await api.get<Habit>(`/habits/${toValue(habitId)}`)
  } catch {
    navigateTo('/')
  } finally {
    isLoading.value = false
  }
}

const fetchStats = async (): Promise<void> => {
  habitStats.value = await statsStore.fetchHabitStats(toValue(habitId))
}

const onToggle = async (): Promise<void> => {
  const id = toValue(habitId)
  const today = new Date().toISOString().split('T')[0]

  if (toValue(isCompleted)) {
    hapticImpact('light')
    await habitsStore.uncompleteHabit(id, today)
  } else {
    hapticNotification('success')
    await habitsStore.completeHabit(id)
  }

  await Promise.all([fetchHabit(), fetchStats()])
}

const onEdit = async (data: CreateHabitPayload): Promise<void> => {
  const updated = await habitsStore.updateHabit(toValue(habitId), data)
  if (updated) {
    habit.value = updated
    hapticNotification('success')
    showSuccess('success.habitUpdated')
  }
}

const onDelete = async (): Promise<void> => {
  const success = await habitsStore.deleteHabit(toValue(habitId))
  if (success) {
    hapticNotification('warning')
    showSuccess('success.habitDeleted')
    navigateTo('/')
  }
}

onMounted(async () => {
  if (toValue(habitsStore.habits).length === 0) {
    await habitsStore.fetchHabits()
  }
  await Promise.all([fetchHabit(), fetchStats()])
})
</script>

<template>
  <div class="p-4 space-y-4">
    <HabitsHabitDetailSkeleton v-if="isLoading" />

    <template v-else-if="habit">
      <Button
        variant="ghost"
        size="sm"
        class="gap-1 -ml-2 text-muted-foreground"
        @click="navigateTo('/')"
      >
        <ArrowLeft class="h-4 w-4" />
        {{ $t('habit.back') }}
      </Button>

      <div class="flex items-center gap-4">
        <div
          class="w-16 h-16 rounded-2xl glass flex items-center justify-center"
          :class="isCompleted ? 'bg-primary/20' : ''"
        >
          <component :is="habitIcon" class="h-8 w-8" />
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold truncate">{{ habit.name }}</h1>
          <div class="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <component :is="TIME_OF_DAY_ICONS[habit.timeOfDay]" class="h-4 w-4" />
            <span>{{ $t(`timeOfDay.${habit.timeOfDay}`) }}</span>
          </div>
        </div>
      </div>

      <Button
        class="w-full gap-2"
        :class="!isCompleted ? 'bg-gradient-primary border-0 text-white hover:opacity-90' : ''"
        :variant="isCompleted ? 'secondary' : 'default'"
        @click="onToggle"
      >
        <Check v-if="isCompleted" class="h-4 w-4" />
        {{ isCompleted ? $t('habit.completed') : $t('habit.markCompleted') }}
      </Button>

      <div class="grid grid-cols-2 gap-3">
        <Card class="glass stagger-item" :style="{ '--stagger': 0 }">
          <CardContent class="pt-4 pb-4 text-center">
            <div class="text-2xl font-bold">{{ habit.currentStreak }}</div>
            <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
              <Flame class="h-3 w-3 text-orange-500 icon-glow" />
              {{ $t('habit.currentStreak') }}
            </div>
          </CardContent>
        </Card>
        <Card class="glass stagger-item" :style="{ '--stagger': 1 }">
          <CardContent class="pt-4 pb-4 text-center">
            <div class="text-2xl font-bold">{{ habit.bestStreak }}</div>
            <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
              <Trophy class="h-3 w-3 text-yellow-500 icon-glow" />
              {{ $t('habit.bestStreak') }}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card v-if="habitStats" class="glass stagger-item" :style="{ '--stagger': 2 }">
        <CardContent class="pt-4 pb-4 text-center">
          <div class="text-2xl font-bold">{{ habitStats.totalCompletions }}</div>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <Check class="h-3 w-3 text-primary" />
            {{ $t('habit.totalCompletions') }}
          </div>
        </CardContent>
      </Card>

      <Card v-if="habitStats && habitStats.weeklyData.length > 0" class="glass stagger-item" :style="{ '--stagger': 3 }">
        <CardContent class="pt-4 pb-4">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <BarChart3 class="h-3.5 w-3.5" />
            {{ $t('habit.week') }}
          </div>
          <StatsWeeklyChart :data="habitStats.weeklyData" />
        </CardContent>
      </Card>

      <Card v-if="habitStats && habitStats.heatmap.length > 0" class="glass stagger-item" :style="{ '--stagger': 4 }">
        <CardContent class="pt-4 pb-4">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Calendar class="h-3.5 w-3.5" />
            {{ $t('habit.activity3months') }}
          </div>
          <StatsCalendarHeatmap :data="habitStats.heatmap" />
        </CardContent>
      </Card>

      <Card v-if="habit.description" class="glass">
        <CardContent class="pt-4 pb-4">
          <div class="text-xs text-muted-foreground mb-1">{{ $t('habit.description') }}</div>
          <div class="text-sm">{{ habit.description }}</div>
        </CardContent>
      </Card>

      <div class="space-y-2 pt-2">
        <Button
          variant="ghost"
          class="w-full justify-start gap-3 h-12 rounded-xl glass border-white/10 dark:border-white/5 hover:bg-white/10"
          @click="showEditForm = true"
        >
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Pencil class="h-4 w-4 text-primary" />
          </div>
          {{ $t('habit.edit') }}
        </Button>

        <AlertDialog v-model:open="showDeleteConfirm">
          <AlertDialogTrigger as-child>
            <Button
              variant="ghost"
              class="w-full justify-start gap-3 h-12 rounded-xl glass border-white/10 dark:border-white/5 hover:bg-destructive/10"
            >
              <div class="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Trash2 class="h-4 w-4 text-destructive" />
              </div>
              <span class="text-destructive">{{ $t('habit.deleteHabit') }}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ $t('habit.deleteConfirmTitle') }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ $t('habit.deleteConfirmDescription') }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ $t('habit.cancel') }}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" @click="onDelete">
                {{ $t('habit.delete') }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <HabitsHabitForm
        :open="showEditForm"
        :edit-mode="true"
        :initial-data="{
          name: habit.name,
          icon: habit.icon ?? undefined,
          timeOfDay: habit.timeOfDay,
          frequency: habit.frequency,
        }"
        @update:open="showEditForm = $event"
        @submit="onEdit"
      />
    </template>
  </div>
</template>
