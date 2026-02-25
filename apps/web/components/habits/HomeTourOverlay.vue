<script setup lang="ts">
import { Check, Flame, Calendar } from 'lucide-vue-next'

interface Props {
  show: boolean
  streakEl: HTMLElement | null
  weekEl: HTMLElement | null
  habitListEl: HTMLElement | null
}

interface Emits {
  (e: 'close', dontShowAgain: boolean): void
}

interface TourStep {
  titleKey: string
  textKey: string
  icon: typeof Check
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const currentStep = ref<number>(0)
const spotlightStyle = ref<Record<string, string>>({})

const steps: TourStep[] = [
  { titleKey: 'homeTour.step1Title', textKey: 'homeTour.step1Text', icon: Check },
  { titleKey: 'homeTour.step2Title', textKey: 'homeTour.step2Text', icon: Calendar },
  { titleKey: 'homeTour.step3Title', textKey: 'homeTour.step3Text', icon: Flame },
]

const targetForStep = (step: number): HTMLElement | null => {
  if (step === 0) {
    // First habit card toggle
    if (props.habitListEl) {
      return props.habitListEl.querySelector('.habit-card') as HTMLElement | null
    }
    return null
  }
  if (step === 1) return props.weekEl
  if (step === 2) return props.streakEl
  return null
}

const updateSpotlight = (): void => {
  const el = targetForStep(toValue(currentStep))
  if (!el) {
    spotlightStyle.value = {}
    return
  }
  const rect = el.getBoundingClientRect()
  const padding = 6
  spotlightStyle.value = {
    position: 'fixed',
    top: `${rect.top - padding}px`,
    left: `${rect.left - padding}px`,
    width: `${rect.width + padding * 2}px`,
    height: `${rect.height + padding * 2}px`,
    borderRadius: '16px',
    border: '2px solid hsl(var(--primary))',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
    zIndex: '50',
    pointerEvents: 'none',
    transition: 'all 0.3s ease',
  }
}

const tooltipStyle = computed<Record<string, string>>(() => {
  const el = targetForStep(toValue(currentStep))
  if (!el) return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  const rect = el.getBoundingClientRect()
  const below = rect.bottom + 16
  const viewportHeight = window.innerHeight
  // Show tooltip below target if space, otherwise above
  if (below + 140 < viewportHeight) {
    return { position: 'fixed', top: `${below}px`, left: '16px', right: '16px' }
  }
  return { position: 'fixed', bottom: `${viewportHeight - rect.top + 16}px`, left: '16px', right: '16px' }
})

const isLast = computed<boolean>(() => toValue(currentStep) === steps.length - 1)

const onNext = (): void => {
  if (toValue(isLast)) {
    emit('close', true)
  } else {
    currentStep.value++
    nextTick(() => updateSpotlight())
  }
}

const onSkip = (): void => {
  emit('close', true)
}

watch(() => props.show, (val) => {
  if (val) {
    currentStep.value = 0
    nextTick(() => updateSpotlight())
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[49]"
      @click="onSkip"
    >
      <!-- Spotlight cutout -->
      <div :style="spotlightStyle" />

      <!-- Tooltip -->
      <Card
        class="z-[51] animate-in fade-in-0 zoom-in-95 duration-200 glass-heavy"
        :style="tooltipStyle"
        @click.stop
      >
        <CardContent class="pt-4 pb-4 space-y-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <component :is="steps[currentStep].icon" class="h-4 w-4 text-primary" />
            </div>
            <div>
              <div class="text-sm font-semibold">{{ t(steps[currentStep].titleKey) }}</div>
              <div class="text-xs text-muted-foreground">{{ t(steps[currentStep].textKey) }}</div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex gap-1">
              <div
                v-for="(_, i) in steps"
                :key="i"
                class="w-1.5 h-1.5 rounded-full transition-colors"
                :class="i <= currentStep ? 'bg-primary' : 'bg-muted'"
              />
            </div>
            <div class="flex gap-2">
              <Button
                v-if="!isLast"
                variant="ghost"
                size="sm"
                class="text-xs h-7"
                @click="onSkip"
              >
                {{ t('homeTour.skip') }}
              </Button>
              <Button
                size="sm"
                class="text-xs h-7 bg-gradient-primary border-0 text-white hover:opacity-90"
                @click="onNext"
              >
                {{ isLast ? t('homeTour.done') : t('homeTour.next') }}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </Teleport>
</template>
