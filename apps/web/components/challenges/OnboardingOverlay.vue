<script setup lang="ts">
import { Target, Flame, Trophy } from 'lucide-vue-next'
import { Vue3Lottie } from 'vue3-lottie'
import challengeAnimation from '~/assets/animations/challenges-onboarding.json'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close', dontShowAgain: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { fire } = useConfetti()

const dontShowAgain = ref<boolean>(false)

watch(() => props.show, (val) => {
  if (val) {
    fire('burst')
  }
})

const onClose = (): void => {
  emit('close', toValue(dontShowAgain))
}

const features = [
  { icon: Target, key: 'challengesOnboarding.feature1' },
  { icon: Flame, key: 'challengesOnboarding.feature2' },
  { icon: Trophy, key: 'challengesOnboarding.feature3' },
] as const
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click="onClose"
  >
    <Card class="w-80 text-center animate-in zoom-in-95 duration-300 glass-heavy" @click.stop>
      <CardContent class="pt-4 pb-6 space-y-4">
        <div class="mx-auto w-36 h-36">
          <Vue3Lottie
            :animation-data="challengeAnimation"
            :loop="true"
            :speed="0.8"
          />
        </div>

        <div>
          <h2 class="text-xl font-bold">{{ $t('challengesOnboarding.title') }}</h2>
          <p class="text-sm text-muted-foreground mt-2 leading-relaxed">
            {{ $t('challengesOnboarding.description') }}
          </p>
        </div>

        <div class="space-y-2.5 text-left px-2">
          <div
            v-for="feature in features"
            :key="feature.key"
            class="flex items-center gap-2.5 text-sm"
          >
            <div class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <component :is="feature.icon" class="h-3.5 w-3.5 text-primary" />
            </div>
            <span class="text-muted-foreground">{{ $t(feature.key) }}</span>
          </div>
        </div>

        <div
          class="flex items-center justify-center gap-2 cursor-pointer select-none"
          @click="dontShowAgain = !dontShowAgain"
        >
          <Checkbox :checked="dontShowAgain" />
          <span class="text-xs text-muted-foreground">
            {{ $t('challengesOnboarding.dontShowAgain') }}
          </span>
        </div>

        <Button
          class="w-full bg-gradient-primary border-0 text-white hover:opacity-90"
          @click="onClose"
        >
          {{ $t('challengesOnboarding.button') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
