<script setup lang="ts">
import { Target, Flame, Zap, CheckCircle } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { GoalType, CreateGoalPayload } from '~/types/goal'
import { GOAL_TARGET_PRESETS, GOAL_DURATION_PRESETS } from '~/constants'

interface Props {
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'submit', data: CreateGoalPayload): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

interface GoalTypeOption {
  type: GoalType
  icon: Component
  color: string
  bg: string
}

const GOAL_TYPES: GoalTypeOption[] = [
  { type: 'completion_rate', icon: Target, color: 'text-primary', bg: 'bg-primary/15' },
  { type: 'streak_days', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/15' },
  { type: 'total_xp', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/15' },
  { type: 'total_completions', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/15' },
]

const selectedType = ref<GoalType | null>(null)
const selectedTarget = ref<number | null>(null)
const selectedDuration = ref<number | null>(null)

const targetPresets = computed<readonly number[]>(() => {
  const type = toValue(selectedType)
  if (!type) return []
  return GOAL_TARGET_PRESETS[type]
})

const isValid = computed<boolean>(() =>
  toValue(selectedType) !== null
  && toValue(selectedTarget) !== null
  && toValue(selectedDuration) !== null,
)

const formatTarget = (type: GoalType, value: number): string => {
  if (type === 'completion_rate') return `${value}%`
  return String(value)
}

const onTypeSelect = (type: GoalType): void => {
  selectedType.value = type
  selectedTarget.value = null
  selectedDuration.value = null
}

const onSubmit = (): void => {
  const type = toValue(selectedType)
  const target = toValue(selectedTarget)
  const duration = toValue(selectedDuration)
  if (!type || !target || !duration) return

  emit('submit', {
    type,
    targetValue: target,
    durationDays: duration,
  })
  reset()
  emit('update:open', false)
}

const reset = (): void => {
  selectedType.value = null
  selectedTarget.value = null
  selectedDuration.value = null
}

watch(
  () => props.open,
  (val) => { if (val) reset() },
)
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="rounded-t-2xl glass-heavy max-h-[85vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ $t('goals.form.title') }}</SheetTitle>
        <SheetDescription>{{ $t('goals.form.description') }}</SheetDescription>
      </SheetHeader>

      <div class="space-y-5 py-4">
        <!-- Step 1: Goal type -->
        <div class="space-y-2">
          <Label>{{ $t('goals.form.selectType') }}</Label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in GOAL_TYPES"
              :key="opt.type"
              class="flex items-center gap-2.5 p-3 rounded-xl border transition-all"
              :class="selectedType === opt.type
                ? 'border-primary bg-primary/5'
                : 'border-transparent glass hover:bg-foreground/5'"
              @click="onTypeSelect(opt.type)"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                :class="opt.bg"
              >
                <component :is="opt.icon" class="h-4 w-4" :class="opt.color" />
              </div>
              <span class="text-xs font-medium text-left leading-tight">
                {{ $t(`goals.type.${opt.type}`) }}
              </span>
            </button>
          </div>
        </div>

        <!-- Step 2: Target value -->
        <div v-if="selectedType" class="space-y-2 animate-fade-in-up">
          <Label>{{ $t('goals.form.selectTarget') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="selectedTarget !== null ? String(selectedTarget) : undefined"
            class="flex flex-wrap justify-start gap-2"
            @update:model-value="(val) => { if (val) selectedTarget = Number(val) }"
          >
            <ToggleGroupItem
              v-for="preset in targetPresets"
              :key="preset"
              :value="String(preset)"
              class="px-4 h-9"
            >
              {{ formatTarget(selectedType, preset) }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <!-- Step 3: Duration -->
        <div v-if="selectedTarget !== null" class="space-y-2 animate-fade-in-up">
          <Label>{{ $t('goals.form.selectDuration') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="selectedDuration !== null ? String(selectedDuration) : undefined"
            class="flex flex-wrap justify-start gap-2"
            @update:model-value="(val) => { if (val) selectedDuration = Number(val) }"
          >
            <ToggleGroupItem
              v-for="preset in GOAL_DURATION_PRESETS"
              :key="preset"
              :value="String(preset)"
              class="px-4 h-9"
            >
              {{ $t('goals.form.durationDays', { count: preset }) }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <!-- Submit -->
        <Button
          v-if="selectedType"
          :disabled="!isValid"
          class="w-full bg-gradient-primary border-0 text-white hover:opacity-90"
          @click="onSubmit"
        >
          {{ $t('goals.form.submit') }}
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
