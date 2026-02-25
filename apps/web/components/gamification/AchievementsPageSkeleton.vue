<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <Skeleton class="h-5 w-5 rounded" />
      <Skeleton class="h-7 w-32 rounded" />
      <Skeleton class="ml-auto h-5 w-10 rounded-full" />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <GamificationAchievementCardSkeleton v-for="i in 6" :key="i" />
    </div>
  </div>
</template>
