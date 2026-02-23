<script setup lang="ts">
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'

const props = withDefaults(defineProps<ToasterProps>(), {
  position: 'top-center',
  duration: 3000,
})
</script>

<template>
  <Sonner
    v-bind="props"
    class="toaster group"
    :toast-options="{
      classes: {
        toast: 'group toast group-[.toaster]:bg-[var(--glass-bg-heavy)] group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        error: 'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive',
        success: 'group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground group-[.toaster]:border-primary',
      },
    }"
  />
</template>
