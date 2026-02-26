<script setup lang="ts">
import { Vue3Lottie } from 'vue3-lottie'
import rewardAnimation from '~/assets/animations/daily-reward.json'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const { fire } = useConfetti()

watch(() => props.show, (val) => {
  if (val) {
    fire('celebration')
  }
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click="$emit('close')"
  >
    <Card class="w-72 text-center animate-in zoom-in-95 duration-300 glass-heavy" @click.stop>
      <CardContent class="pt-4 pb-6 space-y-4">
        <div class="mx-auto w-32 h-32">
          <Vue3Lottie
            :animation-data="rewardAnimation"
            :loop="true"
            :speed="0.9"
          />
        </div>

        <div>
          <h2 class="text-xl font-bold">{{ $t('home.perfectDay.title') }}</h2>
          <p class="text-sm text-muted-foreground mt-1">
            {{ $t('home.perfectDay.subtitle') }}
          </p>
        </div>

        <Button
          class="w-full bg-gradient-primary border-0 text-white hover:opacity-90"
          @click="$emit('close')"
        >
          {{ $t('home.perfectDay.button') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
