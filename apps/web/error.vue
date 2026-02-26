<script setup lang="ts">
import { AlertTriangle, Home } from 'lucide-vue-next'

interface Props {
  error: {
    statusCode: number
    message: string
  }
}

defineProps<Props>()

const handleGoHome = (): void => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page bg-mesh">
    <AlertTriangle class="h-16 w-16 text-destructive mb-4" />
    <h1 class="text-xl font-bold mb-2">
      {{ error.statusCode === 404 ? 'Страница не найдена' : 'Что-то пошло не так' }}
    </h1>
    <p class="text-sm text-muted-foreground text-center max-w-[280px] mb-6">
      {{ error.message }}
    </p>
    <Button
      class="bg-gradient-primary border-0 text-white hover:opacity-90 rounded-xl"
      @click="handleGoHome"
    >
      <Home class="h-4 w-4 mr-2" />
      На главную
    </Button>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: var(--color-background);
  color: var(--color-foreground);
}
</style>
