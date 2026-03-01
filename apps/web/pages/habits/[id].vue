<script setup lang="ts">
import type { Component } from 'vue'
import type { Habit, CreateHabitPayload, HabitCompletion } from '~/types/habit'
import type { HabitStats } from '~/types/stats'
import { TIME_OF_DAY_ICONS } from '~/types/habit'
import { ArrowLeft, Check, Flame, Trophy, Pencil, Trash2, BarChart3, Calendar, MessageSquare } from 'lucide-vue-next'

const route = useRoute()
const habitsStore = useHabitsStore()
const statsStore = useStatsStore()
const { hapticNotification, hapticImpact, showMainButton, hideMainButton } = useTelegram()
const { resolveIcon } = useHabitIcon()
const { showSuccess } = useErrorHandler()
const { t, locale } = useI18n()

const habit = ref<Habit | null>(null)
const habitStats = ref<HabitStats | null>(null)
const completions = ref<HabitCompletion[]>([])
const isLoading = ref<boolean>(true)
const showEditForm = ref<boolean>(false)
const showDeleteConfirm = ref<boolean>(false)
const showNoteSheet = ref<boolean>(false)
const noteText = ref<string>('')

const habitId = computed<number>(() => Number(route.params.id))

const habitIcon = computed<Component>(() => resolveIcon(toValue(habit)?.icon ?? null))

const isCompleted = computed<boolean>(() => habitsStore.isCompleted(toValue(habitId)))

const notedCompletions = computed<HabitCompletion[]>(() =>
  toValue(completions).filter((c) => c.note),
)

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

const fetchCompletions = async (): Promise<void> => {
  const api = useApi()
  completions.value = await api.get<HabitCompletion[]>(`/habits/${toValue(habitId)}/completions`)
}

const onToggle = async (): Promise<void> => {
  if (toValue(isCompleted)) {
    hapticImpact('light')
    const today = new Date().toISOString().split('T')[0]
    await habitsStore.uncompleteHabit(toValue(habitId), today)
    await Promise.all([fetchHabit(), fetchStats(), fetchCompletions()])
  } else {
    noteText.value = ''
    showNoteSheet.value = true
    hideMainButton()
  }
}

const onCompleteWithNote = async (note: string): Promise<void> => {
  showNoteSheet.value = false
  hapticNotification('success')
  await habitsStore.completeHabit(toValue(habitId), note || undefined)
  await Promise.all([fetchHabit(), fetchStats(), fetchCompletions()])
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

const formatNoteDate = (dateStr: string): string => {
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short' }).format(new Date(dateStr))
}

watch(isCompleted, (completed: boolean) => {
  if (completed) {
    hideMainButton()
  } else {
    showMainButton(t('habit.markCompleted'), () => { onToggle() })
  }
})

watch(showNoteSheet, (open: boolean) => {
  if (!open && !toValue(isCompleted)) {
    showMainButton(t('habit.markCompleted'), () => { onToggle() })
  }
})

onMounted(async () => {
  if (toValue(habitsStore.habits).length === 0) {
    await habitsStore.fetchHabits()
  }
  await Promise.all([fetchHabit(), fetchStats(), fetchCompletions()])
  if (!toValue(isCompleted)) {
    showMainButton(t('habit.markCompleted'), () => { onToggle() })
  }
})

onUnmounted(() => {
  hideMainButton()
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

      <!-- Notes history -->
      <Card v-if="notedCompletions.length > 0" class="glass stagger-item" :style="{ '--stagger': 5 }">
        <CardContent class="pt-4 pb-4">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <MessageSquare class="h-3.5 w-3.5" />
            {{ $t('habit.notesHistory') }}
          </div>
          <div class="space-y-3">
            <div
              v-for="c in notedCompletions"
              :key="c.id"
              class="flex gap-3"
            >
              <div class="flex flex-col items-center">
                <div class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div class="w-px flex-1 bg-border mt-1" />
              </div>
              <div class="pb-3 flex-1 min-w-0">
                <div class="text-[11px] text-muted-foreground mb-0.5">{{ formatNoteDate(c.completedDate) }}</div>
                <div class="text-sm">{{ c.note }}</div>
              </div>
            </div>
          </div>
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

    <Sheet :open="showNoteSheet" @update:open="showNoteSheet = $event">
      <SheetContent side="bottom" class="rounded-t-2xl glass-heavy">
        <SheetTitle class="text-base">{{ $t('habit.noteTitle') }}</SheetTitle>
        <SheetDescription class="sr-only">{{ $t('habit.noteTitle') }}</SheetDescription>
        <div class="mt-4 space-y-3">
          <textarea
            v-model="noteText"
            :placeholder="$t('habit.notePlaceholder')"
            :maxlength="500"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none h-24"
          />
          <div class="flex gap-2">
            <Button variant="outline" class="flex-1" @click="onCompleteWithNote('')">
              {{ $t('habit.noteSkip') }}
            </Button>
            <Button class="flex-1 bg-gradient-primary border-0 text-white hover:opacity-90" @click="onCompleteWithNote(noteText)">
              <Check class="h-4 w-4 mr-1" />
              {{ $t('habit.noteSubmit') }}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
