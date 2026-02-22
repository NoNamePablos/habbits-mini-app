<script setup lang="ts">
import { Award } from 'lucide-vue-next'

interface UnlockedInfo {
  name: string
  icon: string | null
  xpReward: number
}

interface Props {
  show: boolean
  achievement: UnlockedInfo | null
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { resolveIcon } = useHabitIcon()
</script>

<template>
  <Sheet :open="show" @update:open="!$event && $emit('close')">
    <SheetContent side="bottom" class="rounded-t-2xl">
      <div v-if="achievement" class="flex flex-col items-center text-center py-6 space-y-4">
        <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <component
            :is="achievement.icon ? resolveIcon(achievement.icon) : Award"
            class="h-8 w-8 text-primary"
          />
        </div>
        <div>
          <SheetTitle class="text-lg">{{ $t('gamification.achievementUnlocked') }}</SheetTitle>
          <SheetDescription class="mt-1">
            {{ achievement.name }}
          </SheetDescription>
        </div>
        <Badge variant="secondary" class="text-sm">
          +{{ achievement.xpReward }} XP
        </Badge>
        <Button class="w-full" @click="$emit('close')">
          {{ $t('gamification.achievementButton') }}
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
