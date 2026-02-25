<script setup lang="ts">
import type { Component } from 'vue'
import type { CreateHabitPayload, TimeOfDay } from '~/types/habit'
import {
  Dumbbell, Droplets, BookOpen, Brain,
  PersonStanding, Apple, BedDouble, Pencil, Check,
} from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

const habitsStore = useHabitsStore()
const { markAsSeen, hasSeenOnboarding } = useOnboarding('onboarding')
const { hapticNotification } = useTelegram()
const { showSuccess } = useErrorHandler()
const { t } = useI18n()

interface HabitTemplate {
  icon: Component
  iconName: string
  nameKey: string
  timeOfDay: TimeOfDay
}

const templates: HabitTemplate[] = [
  { icon: Dumbbell, iconName: 'Dumbbell', nameKey: 'onboarding.tplExercise', timeOfDay: 'morning' },
  { icon: Droplets, iconName: 'Droplets', nameKey: 'onboarding.tplWater', timeOfDay: 'anytime' },
  { icon: BookOpen, iconName: 'BookOpen', nameKey: 'onboarding.tplReading', timeOfDay: 'evening' },
  { icon: Brain, iconName: 'Brain', nameKey: 'onboarding.tplMeditation', timeOfDay: 'morning' },
  { icon: PersonStanding, iconName: 'PersonStanding', nameKey: 'onboarding.tplWalking', timeOfDay: 'afternoon' },
  { icon: Apple, iconName: 'Apple', nameKey: 'onboarding.tplHealthyEating', timeOfDay: 'anytime' },
  { icon: BedDouble, iconName: 'BedDouble', nameKey: 'onboarding.tplSleep', timeOfDay: 'evening' },
  { icon: Pencil, iconName: 'Pencil', nameKey: 'onboarding.tplJournaling', timeOfDay: 'evening' },
]

const selected = ref<Set<number>>(new Set())
const isSubmitting = ref<boolean>(false)
const isVisible = ref<boolean>(false)

const selectedCount = computed<number>(() => toValue(selected).size)

onMounted(() => {
  if (toValue(hasSeenOnboarding)) {
    navigateTo('/', { replace: true })
    return
  }
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

const toggleTemplate = (index: number): void => {
  const current = toValue(selected)
  const next = new Set(current)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  selected.value = next
}

const finishOnboarding = (): void => {
  markAsSeen()
  window.location.href = '/'
}

const onSubmit = async (): Promise<void> => {
  const indices = toValue(selected)
  if (indices.size === 0) return

  isSubmitting.value = true

  const payloads: CreateHabitPayload[] = [...indices].map((index) => {
    const tpl = templates[index]
    return {
      name: t(tpl.nameKey),
      icon: tpl.iconName,
      timeOfDay: tpl.timeOfDay,
    }
  })

  const result = await habitsStore.createBatch(payloads)

  if (result) {
    hapticNotification('success')
    showSuccess('success.habitsCreated')
  }

  finishOnboarding()
}

const onSkip = (): void => {
  finishOnboarding()
}
</script>

<template>
  <div class="onboarding-page bg-mesh">
    <h1
      class="onboarding-stagger text-2xl font-bold text-center text-foreground"
      :class="{ 'onboarding-stagger--visible': isVisible }"
      :style="{ '--stagger': 0 }"
    >
      {{ t('onboarding.title') }}
    </h1>

    <p
      class="onboarding-stagger text-sm text-muted-foreground text-center max-w-[280px] leading-relaxed"
      :class="{ 'onboarding-stagger--visible': isVisible }"
      :style="{ '--stagger': 1 }"
    >
      {{ t('onboarding.description') }}
    </p>

    <div class="onboarding-grid">
      <button
        v-for="(tpl, index) in templates"
        :key="tpl.iconName"
        class="onboarding-stagger onboarding-card"
        :class="{
          'onboarding-stagger--visible': isVisible,
          'onboarding-card--selected': selected.has(index),
        }"
        :style="{ '--stagger': index + 2 }"
        @click="toggleTemplate(index)"
      >
        <div class="onboarding-card__check">
          <Check v-if="selected.has(index)" class="h-3 w-3 text-white" />
        </div>
        <div class="onboarding-card__icon">
          <component :is="tpl.icon" class="h-6 w-6" />
        </div>
        <span class="text-xs font-medium text-foreground leading-tight">
          {{ t(tpl.nameKey) }}
        </span>
        <span class="text-[10px] text-muted-foreground">
          {{ t(`timeOfDay.${tpl.timeOfDay}`) }}
        </span>
      </button>
    </div>

    <div
      class="onboarding-stagger onboarding-cta"
      :class="{ 'onboarding-stagger--visible': isVisible }"
      :style="{ '--stagger': templates.length + 2 }"
    >
      <Button
        class="w-full h-12 text-base font-semibold bg-gradient-primary border-0 text-white hover:opacity-90 rounded-xl"
        :disabled="selectedCount === 0 || isSubmitting"
        @click="onSubmit"
      >
        {{ t('onboarding.addSelected', { count: selectedCount }) }}
      </Button>
      <button
        class="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        :disabled="isSubmitting"
        @click="onSkip"
      >
        {{ t('onboarding.skip') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes onboarding-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.onboarding-page {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
  padding-top: max(2rem, env(safe-area-inset-top));
  padding-bottom: max(2rem, env(safe-area-inset-bottom));
  gap: 0.75rem;
  background-color: var(--color-background);
  overflow-y: auto;
}

.onboarding-stagger {
  opacity: 0;
  transform: translateY(16px);

  &--visible {
    animation: onboarding-fade-in-up 0.5s ease-out both;
    animation-delay: calc(var(--stagger, 0) * 80ms);
  }
}

.onboarding-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 320px;
  margin-top: 1rem;
}

.onboarding-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  border-radius: 16px;
  border: 2px solid transparent;
  background: hsl(var(--card) / 0.6);
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.96);
  }

  &--selected {
    border-color: hsl(var(--primary));
    background: hsl(var(--primary) / 0.08);
  }

  &__check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid hsl(var(--muted-foreground) / 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    .onboarding-card--selected & {
      border-color: hsl(var(--primary));
      background: hsl(var(--primary));
    }
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: hsl(var(--primary) / 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(var(--primary));
    transition: all 0.2s ease;

    .onboarding-card--selected & {
      background: hsl(var(--primary) / 0.2);
    }
  }
}

.onboarding-cta {
  width: 100%;
  max-width: 320px;
  margin-top: auto;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
