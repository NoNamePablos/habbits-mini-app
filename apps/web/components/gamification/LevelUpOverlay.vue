<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'

interface Props {
  show: boolean
  level: number
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
    <Card class="w-72 text-center animate-in zoom-in-95 duration-300 glass-heavy">
      <CardContent class="pt-8 pb-6 space-y-4">
        <div class="w-20 h-20 mx-auto rounded-full bg-primary/20 animate-gentle-pulse flex items-center justify-center">
          <TrendingUp class="h-10 w-10 text-primary icon-glow" />
        </div>
        <div>
          <h2 class="text-xl font-bold">{{ $t('gamification.levelUp', { level }) }}</h2>
          <p class="text-sm text-muted-foreground mt-1">
            {{ $t('gamification.levelUpMessage') }}
          </p>
        </div>
        <Button class="w-full bg-gradient-primary border-0 text-white hover:opacity-90" @click="$emit('close')">
          {{ $t('gamification.levelUpButton') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
