<script setup lang="ts">
import { Zap } from 'lucide-vue-next'

const authStore = useAuthStore()
const gamificationStore = useGamificationStore()

const xpRemaining = computed<number>(() =>
  Math.max(0, gamificationStore.xpForNextLevel - gamificationStore.xp),
)
</script>

<template>
  <div v-if="authStore.user" class="px-4 pt-3 pb-1">
    <Card class="glass overflow-hidden">
      <CardContent class="pt-3 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full glass bg-primary/10 flex items-center justify-center shrink-0">
            <span class="text-base font-bold text-primary">
              {{ authStore.displayName?.charAt(0)?.toUpperCase() }}
            </span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm truncate">
              {{ authStore.displayName }}
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" class="text-[10px] gap-0.5 px-1.5 py-0">
                <Zap class="h-2.5 w-2.5 text-primary" />
                {{ $t('home.levelBadge', { level: gamificationStore.level }) }}
              </Badge>
              <span class="text-[10px] text-muted-foreground">
                {{ xpRemaining }} {{ $t('userHeader.xpLeft') }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-2.5">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] text-muted-foreground">
              {{ gamificationStore.xp }} / {{ gamificationStore.xpForNextLevel }} XP
            </span>
            <span class="text-[10px] text-muted-foreground">
              {{ gamificationStore.progressPercent }}%
            </span>
          </div>
          <div class="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-primary rounded-full transition-all duration-500"
              :style="{ width: `${gamificationStore.progressPercent}%` }"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
