<script setup lang="ts">
import { Lightbulb } from 'lucide-vue-next'

interface Props {
  insights: string[]
}

defineProps<Props>()
</script>

<template>
  <Card class="glass animate-fade-in-up">
    <CardContent class="pt-4 pb-4 space-y-2">
      <div class="flex items-center gap-2 mb-3">
        <Lightbulb class="h-4 w-4 text-yellow-500" />
        <span class="text-sm font-semibold">{{ $t('profile.insights') }}</span>
      </div>
      <div
        v-for="insight in insights"
        :key="insight"
        class="flex items-start gap-2 text-sm text-muted-foreground"
      >
        <span class="text-primary mt-0.5">•</span>
        <span>{{ insight }}</span>
      </div>
    </CardContent>
  </Card>
</template>
