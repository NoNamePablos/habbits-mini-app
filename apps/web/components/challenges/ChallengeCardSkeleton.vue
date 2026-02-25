<script setup lang="ts">
interface Props {
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false,
})
</script>

<template>
  <Card class="glass overflow-hidden border-l-[3px] border-l-muted">
    <CardContent class="pt-3 pb-3">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <Skeleton class="w-11 h-11 rounded-xl shrink-0" />
        <div class="flex-1 min-w-0 space-y-1.5">
          <Skeleton class="h-3.5 w-32 rounded" />
          <Skeleton class="h-2.5 w-20 rounded" />
        </div>
        <Skeleton class="h-4 w-4 rounded shrink-0" />
      </div>

      <!-- Stat pills -->
      <div v-if="!compact" class="grid grid-cols-3 gap-2 mt-3">
        <div v-for="i in 3" :key="i" class="rounded-lg bg-secondary/30 py-2 px-1 flex flex-col items-center gap-1">
          <Skeleton class="h-5 w-8 rounded" />
          <Skeleton class="h-2.5 w-12 rounded" />
        </div>
      </div>

      <!-- Check-in button -->
      <div v-if="!compact" class="mt-3">
        <Skeleton class="h-10 w-full rounded-md" />
      </div>
    </CardContent>
  </Card>
</template>
