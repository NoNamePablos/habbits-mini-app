<template>
  <div class="space-y-4">
    <!-- Back button -->
    <Skeleton class="h-8 w-20 rounded" />

    <!-- Habit header -->
    <div class="flex items-center gap-4">
      <Skeleton class="w-16 h-16 rounded-2xl shrink-0" />
      <div class="flex-1 space-y-2">
        <Skeleton class="h-5 w-36 rounded" />
        <Skeleton class="h-3.5 w-20 rounded" />
      </div>
    </div>

    <!-- Toggle button -->
    <Skeleton class="h-10 w-full rounded-md" />

    <!-- Stats grid -->
    <div class="grid grid-cols-2 gap-3">
      <Card v-for="i in 2" :key="i" class="glass">
        <CardContent class="pt-4 pb-4 flex flex-col items-center gap-1.5">
          <Skeleton class="h-6 w-10 rounded" />
          <Skeleton class="h-2.5 w-20 rounded" />
        </CardContent>
      </Card>
    </div>

    <!-- Total completions -->
    <Card class="glass">
      <CardContent class="pt-4 pb-4 flex flex-col items-center gap-1.5">
        <Skeleton class="h-6 w-10 rounded" />
        <Skeleton class="h-2.5 w-28 rounded" />
      </CardContent>
    </Card>

    <!-- Chart -->
    <Card class="glass">
      <CardContent class="pt-4 pb-4">
        <Skeleton class="h-3 w-16 rounded mb-3" />
        <Skeleton class="h-32 w-full rounded" />
      </CardContent>
    </Card>
  </div>
</template>
