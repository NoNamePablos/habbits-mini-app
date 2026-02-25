<template>
  <div class="space-y-4">
    <!-- Title -->
    <Skeleton class="h-7 w-24 rounded" />

    <!-- User card -->
    <Card class="glass">
      <CardContent class="pt-6 pb-4">
        <div class="flex items-center gap-4">
          <Skeleton class="w-14 h-14 rounded-full shrink-0" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-5 w-32 rounded" />
            <Skeleton class="h-3.5 w-20 rounded" />
          </div>
        </div>
        <div class="mt-4 space-y-1.5">
          <div class="flex justify-between">
            <Skeleton class="h-2.5 w-12 rounded" />
            <Skeleton class="h-2.5 w-14 rounded" />
          </div>
          <Skeleton class="h-2 w-full rounded-full" />
        </div>
      </CardContent>
    </Card>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 gap-3">
      <Card v-for="i in 4" :key="i" class="glass">
        <CardContent class="pt-4 pb-4 flex flex-col items-center gap-1.5">
          <Skeleton class="h-6 w-10 rounded" />
          <Skeleton class="h-2.5 w-16 rounded" />
        </CardContent>
      </Card>
    </div>

    <!-- Streak freezes -->
    <Card class="glass">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Skeleton class="h-4 w-4 rounded" />
            <Skeleton class="h-3.5 w-28 rounded" />
          </div>
          <Skeleton class="h-5 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>

    <!-- Achievements link -->
    <Card class="glass">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Skeleton class="h-4 w-4 rounded" />
            <Skeleton class="h-3.5 w-24 rounded" />
          </div>
          <div class="flex items-center gap-1">
            <Skeleton class="h-5 w-10 rounded-full" />
            <Skeleton class="h-4 w-4 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Heatmap -->
    <Card class="glass">
      <CardContent class="pt-4 pb-4">
        <Skeleton class="h-3 w-20 rounded mb-3" />
        <Skeleton class="h-24 w-full rounded" />
      </CardContent>
    </Card>
  </div>
</template>
