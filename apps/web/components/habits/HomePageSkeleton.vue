<template>
  <div class="space-y-4">
    <Card class="glass overflow-hidden">
      <CardContent class="pt-4 pb-4 space-y-4">
        <!-- Streak row -->
        <div class="flex items-center gap-3">
          <Skeleton class="w-11 h-11 rounded-xl shrink-0" />
          <div class="space-y-1.5">
            <Skeleton class="h-2.5 w-12 rounded" />
            <Skeleton class="h-6 w-20 rounded" />
          </div>
        </div>

        <!-- Week circles -->
        <div class="flex items-center justify-between">
          <div v-for="i in 7" :key="i" class="flex flex-col items-center gap-1.5">
            <Skeleton class="w-8 h-8 rounded-full" />
            <Skeleton class="h-2.5 w-6 rounded" />
          </div>
        </div>

        <!-- Daily progress -->
        <div>
          <Skeleton class="h-2.5 w-24 rounded mb-1.5" />
          <div class="flex items-baseline gap-1 mb-2">
            <Skeleton class="h-6 w-12 rounded" />
            <Skeleton class="ml-auto h-3.5 w-8 rounded" />
          </div>
          <Skeleton class="h-2 w-full rounded-full" />
        </div>
      </CardContent>
    </Card>

    <HabitsHabitListSkeleton />
  </div>
</template>
