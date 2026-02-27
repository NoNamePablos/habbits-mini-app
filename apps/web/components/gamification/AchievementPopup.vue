<script setup lang="ts">
import { Award, Share2 } from 'lucide-vue-next'

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

const props = defineProps<Props>()
defineEmits<Emits>()

const { resolveIcon } = useHabitIcon()
const { tg } = useTelegram()
const { t } = useI18n()

const onShare = (): void => {
  if (!props.achievement) return
  const text = t('gamification.shareText', { name: props.achievement.name })
  tg?.openLink(`https://t.me/share/url?text=${encodeURIComponent(text)}`)
}
</script>

<template>
  <Sheet :open="show" @update:open="!$event && $emit('close')">
    <SheetContent side="bottom" class="rounded-t-2xl glass-heavy">
      <div v-if="achievement" class="flex flex-col items-center text-center py-6 space-y-4">
        <div class="w-16 h-16 rounded-full bg-primary/20 animate-gentle-pulse flex items-center justify-center">
          <component
            :is="achievement.icon ? resolveIcon(achievement.icon) : Award"
            class="h-8 w-8 text-primary icon-glow"
          />
        </div>
        <div>
          <SheetTitle class="text-lg">{{ $t('gamification.achievementUnlocked') }}</SheetTitle>
          <SheetDescription class="mt-1">
            {{ achievement.name }}
          </SheetDescription>
        </div>
        <Badge class="text-sm bg-gradient-gold text-white border-0">
          +{{ achievement.xpReward }} XP
        </Badge>
        <div class="flex gap-2 w-full">
          <Button
            variant="outline"
            class="flex-1 gap-2"
            @click="onShare"
          >
            <Share2 class="h-4 w-4" />
            {{ $t('gamification.shareButton') }}
          </Button>
          <Button class="flex-1 bg-gradient-primary border-0 text-white hover:opacity-90" @click="$emit('close')">
            {{ $t('gamification.achievementButton') }}
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
