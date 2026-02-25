<script setup lang="ts">
import { Target, Flame, Trophy } from 'lucide-vue-next'
import { Vue3Lottie } from 'vue3-lottie'
import welcomeAnimation from '~/assets/animations/welcome.json'
import { DEFAULT_DISPLAY_NAME } from '~/constants'

definePageMeta({
  layout: false,
})

const { user: tgUser } = useTelegram()
const { markAsSeen } = useOnboarding('welcome')
const { t } = useI18n()

const displayName = computed<string>(() => {
  const u = toValue(tgUser)
  return u?.first_name || u?.username || DEFAULT_DISPLAY_NAME
})

const isVisible = ref<boolean>(false)

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

const features = [
  { icon: Target, key: 'welcome.feature1' },
  { icon: Flame, key: 'welcome.feature2' },
  { icon: Trophy, key: 'welcome.feature3' },
] as const

const onStart = (): void => {
  markAsSeen()
  navigateTo('/onboarding', { replace: true })
}
</script>

<template>
  <div class="welcome-page bg-mesh">
    <div
      class="welcome-stagger welcome-lottie"
      :class="{ 'welcome-stagger--visible': isVisible }"
      :style="{ '--stagger': 0 }"
    >
      <Vue3Lottie
        :animation-data="welcomeAnimation"
        :loop="true"
        :speed="0.8"
      />
    </div>

    <h1
      class="welcome-stagger text-2xl font-bold text-center text-foreground"
      :class="{ 'welcome-stagger--visible': isVisible }"
      :style="{ '--stagger': 1 }"
    >
      {{ t('welcome.greeting', { name: displayName }) }}
    </h1>

    <p
      class="welcome-stagger text-sm text-muted-foreground text-center max-w-[280px] leading-relaxed"
      :class="{ 'welcome-stagger--visible': isVisible }"
      :style="{ '--stagger': 2 }"
    >
      {{ t('welcome.description') }}
    </p>

    <div class="welcome-features">
      <div
        v-for="(feature, index) in features"
        :key="feature.key"
        class="welcome-stagger welcome-feature"
        :class="{ 'welcome-stagger--visible': isVisible }"
        :style="{ '--stagger': index + 3 }"
      >
        <div class="welcome-feature__icon">
          <component :is="feature.icon" class="h-5 w-5 text-primary" />
        </div>
        <span class="text-sm text-foreground">{{ t(feature.key) }}</span>
      </div>
    </div>

    <div
      class="welcome-stagger welcome-cta"
      :class="{ 'welcome-stagger--visible': isVisible }"
      :style="{ '--stagger': 6 }"
    >
      <Button
        class="w-full h-12 text-base font-semibold bg-gradient-primary border-0 text-white hover:opacity-90 rounded-xl"
        @click="onStart"
      >
        {{ t('welcome.button') }}
      </Button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes welcome-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes welcome-scale-pop {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }

  60% {
    opacity: 1;
    transform: scale(1.06);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.welcome-page {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  padding-bottom: max(2rem, env(safe-area-inset-bottom));
  gap: 0.75rem;
  background-color: var(--color-background);
  overflow: hidden;
}

.welcome-stagger {
  opacity: 0;
  transform: translateY(16px);

  &--visible {
    animation: welcome-fade-in-up 0.5s ease-out both;
    animation-delay: calc(var(--stagger, 0) * 120ms);
  }
}

.welcome-lottie {
  width: 200px;
  height: 160px;
  flex-shrink: 0;
  margin-bottom: 0.5rem;

  .welcome-stagger--visible & ,
  &.welcome-stagger--visible {
    animation-name: welcome-scale-pop;
    animation-duration: 0.6s;
    animation-timing-function: ease-out;
  }
}

.welcome-features {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 300px;
  margin-top: 1.5rem;
}

.welcome-feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: hsl(var(--primary) / 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

.welcome-cta {
  width: 100%;
  max-width: 300px;
  margin-top: auto;
  padding-top: 1.5rem;
}
</style>
