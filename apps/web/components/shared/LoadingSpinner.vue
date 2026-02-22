<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('flex items-center justify-center h-64', props.class)">
    <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
</template>
