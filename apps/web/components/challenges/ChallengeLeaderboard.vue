<script setup lang="ts">
import { Crown } from 'lucide-vue-next'
import type { LeaderboardEntry } from '~/types/challenge'

const props = defineProps<{
  entries: LeaderboardEntry[]
  currentUserId: number
}>()

const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'] as const

const getDisplayName = (entry: LeaderboardEntry): string => {
  return entry.firstName ?? entry.username ?? `User ${entry.userId}`
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(entry, index) in entries"
      :key="entry.userId"
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
      :class="entry.userId === currentUserId ? 'bg-primary/10 border border-primary/20' : 'bg-card/50'"
    >
      <div class="w-6 text-center shrink-0">
        <Crown
          v-if="index < 3"
          class="h-4 w-4 mx-auto"
          :class="medalColors[index]"
        />
        <span v-else class="text-xs text-muted-foreground font-medium">{{ index + 1 }}</span>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-medium truncate">{{ getDisplayName(entry) }}</span>
          <Badge
            v-if="entry.isCreator"
            variant="outline"
            class="text-[9px] px-1 py-0 h-3.5 shrink-0"
          >
            {{ $t('challenges.creator') }}
          </Badge>
          <Badge
            v-if="entry.userId === currentUserId"
            variant="secondary"
            class="text-[9px] px-1 py-0 h-3.5 shrink-0"
          >
            {{ $t('challenges.you') }}
          </Badge>
        </div>
        <div class="text-[10px] text-muted-foreground">
          {{ $t('xpBar.level', { level: entry.level }) }}
        </div>
      </div>

      <div class="text-right shrink-0">
        <div class="text-sm font-bold">{{ entry.completedDays }}</div>
        <div class="text-[10px] text-muted-foreground">{{ $t('challenges.completedDays') }}</div>
      </div>

      <div
        v-if="entry.currentStreak > 0"
        class="text-right shrink-0"
      >
        <div class="text-sm font-bold text-orange-500">🔥{{ entry.currentStreak }}</div>
      </div>
    </div>
  </div>
</template>
