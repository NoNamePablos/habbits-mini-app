<script setup lang="ts">
import type { ChallengeListItem } from '~/types/challenge'
import { Flame, Check, ChevronRight } from 'lucide-vue-next'

interface Props {
  challenge: ChallengeListItem
  compact?: boolean
}

interface Emits {
  (e: 'click', id: number): void
  (e: 'checkIn', id: number): void
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})
defineEmits<Emits>()

const { resolveIcon } = useHabitIcon()
const { t } = useI18n()

const challengeIcon = computed(() => resolveIcon(props.challenge.icon))

const currentDay = computed<number>(() =>
  props.challenge.completedDays + props.challenge.missedDays,
)

const progressPercent = computed<number>(() => {
  const total = props.challenge.durationDays
  if (total === 0) return 0
  return Math.min(Math.round((toValue(currentDay) / total) * 100), 100)
})

const statusLabel = computed<string | null>(() => {
  switch (props.challenge.status) {
    case 'completed': return t('challenges.statusCompleted')
    case 'failed': return t('challenges.statusFailed')
    case 'abandoned': return t('challenges.statusAbandoned')
    default: return null
  }
})

const statusVariant = computed<'default' | 'destructive' | 'secondary'>(() => {
  switch (props.challenge.status) {
    case 'completed': return 'default'
    case 'failed': return 'destructive'
    default: return 'secondary'
  }
})

const isActive = computed<boolean>(() => props.challenge.status === 'active')
</script>

<template>
  <Card
    class="glass overflow-hidden transition-all active:scale-[0.98] cursor-pointer border-l-[3px]"
    :style="{ borderLeftColor: challenge.color }"
    @click="$emit('click', challenge.id)"
  >
    <CardContent class="pt-3 pb-3">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div
          class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          :style="{ backgroundColor: `${challenge.color}20` }"
        >
          <component
            :is="challengeIcon"
            class="h-5 w-5"
            :style="{ color: challenge.color }"
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm truncate">{{ challenge.title }}</div>
          <div class="text-xs text-muted-foreground mt-0.5">
            <template v-if="isActive">
              {{ $t('challenges.dayOf', { current: currentDay + 1, total: challenge.durationDays }) }}
            </template>
            <template v-else>
              {{ $t('challenges.daysLabel', { count: challenge.completedDays }) }}
            </template>
          </div>
        </div>

        <Badge v-if="statusLabel" :variant="statusVariant" class="shrink-0 text-[10px]">
          {{ statusLabel }}
        </Badge>
        <ChevronRight v-else class="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </div>

      <!-- Stat pills (active non-compact only) -->
      <div v-if="!compact" class="grid grid-cols-3 gap-2 mt-3">
        <div class="rounded-lg bg-secondary/30 py-2 px-1 text-center">
          <div class="text-lg font-bold leading-tight">{{ challenge.completedDays }}</div>
          <div class="text-[10px] text-muted-foreground">{{ $t('challenges.statCompleted') }}</div>
        </div>
        <div class="rounded-lg bg-secondary/30 py-2 px-1 text-center">
          <div class="text-lg font-bold leading-tight">{{ progressPercent }}%</div>
          <div class="text-[10px] text-muted-foreground">{{ $t('challenges.statProgress') }}</div>
        </div>
        <div class="rounded-lg bg-secondary/30 py-2 px-1 text-center">
          <div class="text-lg font-bold leading-tight flex items-center justify-center gap-1" :style="{ color: challenge.currentStreak > 0 ? challenge.color : undefined }">
            <Flame v-if="challenge.currentStreak > 0" class="h-4 w-4" />
            {{ challenge.currentStreak }}
          </div>
          <div class="text-[10px] text-muted-foreground">{{ $t('challenges.statStreak') }}</div>
        </div>
      </div>

      <!-- Check-in button (active only) -->
      <div v-if="!compact && isActive" class="mt-3">
        <Button
          v-if="!challenge.todayCheckedIn"
          class="w-full bg-gradient-primary border-0 text-white hover:opacity-90 h-10"
          @click.stop="$emit('checkIn', challenge.id)"
        >
          <Check class="h-4 w-4 mr-1.5" />
          {{ $t('challenges.checkInShort') }}
        </Button>
        <Button
          v-else
          variant="outline"
          class="w-full h-10 glass"
          disabled
          @click.stop
        >
          <Check class="h-4 w-4 mr-1.5 text-green-500" />
          {{ $t('challenges.checkedShort') }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
