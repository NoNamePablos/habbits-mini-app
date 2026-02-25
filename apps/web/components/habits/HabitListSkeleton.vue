<script setup lang="ts">
interface SkeletonGroup {
  cardCount: number
  labelWidth: string
}

const groups: SkeletonGroup[] = [
  { cardCount: 3, labelWidth: 'w-16' },
  { cardCount: 2, labelWidth: 'w-20' },
]
</script>

<template>
  <div class="space-y-4">
    <div v-for="(group, gIdx) in groups" :key="gIdx" class="space-y-2">
      <div class="flex items-center gap-2 px-1">
        <Skeleton class="h-4 w-4 rounded" />
        <Skeleton class="h-2.5 rounded" :class="group.labelWidth" />
      </div>
      <div class="space-y-1.5">
        <HabitsHabitCardSkeleton v-for="cIdx in group.cardCount" :key="cIdx" />
      </div>
    </div>
  </div>
</template>
