<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import { Vue3Lottie } from 'vue3-lottie'
import rewardAnimation from '~/assets/animations/daily-reward.json'
import type { Goal } from '~/types/goal'

interface Props {
  show: boolean
  goal: Goal | null
  xpEarned: number
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const { fire } = useConfetti()
const { t } = useI18n()

watch(() => props.show, (val) => {
  if (val) {
    fire('celebration')
  }
})
</script>

<template>
  <div
    v-if="show && goal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click="$emit('close')"
  >
    <Card class="w-80 text-center animate-in zoom-in-95 duration-300 glass-heavy" @click.stop>
      <CardContent class="pt-4 pb-6 space-y-4">
        <div class="mx-auto w-28 h-28">
          <Vue3Lottie
            :animation-data="rewardAnimation"
            :loop="true"
            :speed="0.8"
          />
        </div>

        <div>
          <h2 class="text-xl font-bold">{{ $t('goals.completed') }}</h2>
          <p class="text-sm text-muted-foreground mt-1">
            {{ $t(`goals.typeDescription.${goal.type}`, { target: goal.targetValue }) }}
          </p>
        </div>

        <div v-if="xpEarned > 0" class="flex justify-center">
          <Badge class="text-sm px-3 py-1 bg-gradient-gold text-white border-0">
            <Trophy class="h-3.5 w-3.5 mr-1.5" />
            +{{ xpEarned }} XP
          </Badge>
        </div>

        <Button class="w-full bg-gradient-primary border-0 text-white hover:opacity-90" @click="$emit('close')">
          {{ $t('goals.button') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
