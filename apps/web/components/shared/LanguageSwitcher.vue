<script setup lang="ts">
const { locale } = useI18n()

const toggleLocale = (): void => {
  locale.value = locale.value === 'ru' ? 'en' : 'ru'
}

const currentFlag = computed<string>(() =>
  locale.value === 'ru' ? '🇷🇺' : '🇺🇸',
)
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    class="text-base"
    @click="toggleLocale"
  >
    {{ currentFlag }}
  </Button>
</template>
