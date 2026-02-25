<template>
  <div class="space-y-4">
    <!-- Back -->
    <div class="flex items-center gap-2">
      <Skeleton class="h-8 w-8 rounded" />
      <Skeleton class="h-3.5 w-12 rounded" />
    </div>

    <!-- Header -->
    <div class="flex flex-col items-center text-center space-y-3">
      <Skeleton class="w-16 h-16 rounded-2xl" />
      <Skeleton class="h-5 w-40 rounded" />
    </div>

    <!-- Progress circle -->
    <div class="flex justify-center">
      <Skeleton class="w-[140px] h-[140px] rounded-full" />
    </div>

    <!-- Day grid -->
    <Card class="glass">
      <CardContent class="pt-4 pb-4">
        <Skeleton class="h-20 w-full rounded" />
      </CardContent>
    </Card>

    <!-- Stats 2x2 -->
    <div class="grid grid-cols-2 gap-3">
      <Card v-for="i in 4" :key="i" class="glass">
        <CardContent class="pt-4 pb-4 flex flex-col items-center gap-1.5">
          <Skeleton class="h-4 w-4 rounded mb-1" />
          <Skeleton class="h-6 w-8 rounded" />
          <Skeleton class="h-2.5 w-16 rounded" />
        </CardContent>
      </Card>
    </div>

    <!-- Check-in button -->
    <Skeleton class="h-12 w-full rounded-md" />
  </div>
</template>
