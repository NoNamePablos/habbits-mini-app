<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'

interface Props {
  show: boolean
  title: string
  durationDays: number
  xpBonus: number
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { fire } = useConfetti()

watch(
  () => props.show,
  (val) => {
    if (val) {
      fire('celebration')
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click="emit('close')"
    >
      <div
        class="w-72 text-center animate-in zoom-in-95 duration-300 glass-heavy rounded-2xl p-6 space-y-4"
        @click.stop
      >
        <div class="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-gentle-pulse">
          <Trophy class="h-10 w-10 text-primary icon-glow" />
        </div>

        <div class="space-y-1">
          <h2 class="text-xl font-bold">{{ $t('challenges.completeTitle') }}</h2>
          <p class="text-sm text-muted-foreground">
            {{ $t('challenges.completeMessage', { title, days: durationDays }) }}
          </p>
        </div>

        <Badge v-if="xpBonus > 0" class="text-sm px-4 py-1 bg-gradient-gold text-white border-0">
          +{{ xpBonus }} XP
        </Badge>

        <Button
          class="w-full bg-gradient-primary border-0 text-white hover:opacity-90"
          @click="emit('close')"
        >
          {{ $t('challenges.completeButton') }}
        </Button>
      </div>
    </div>
  </Teleport>
</template>
