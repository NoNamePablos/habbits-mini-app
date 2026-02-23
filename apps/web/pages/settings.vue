<script setup lang="ts">
import { ArrowLeft, Globe, Info } from 'lucide-vue-next'

const router = useRouter()
const { locale } = useI18n()

const currentLanguage = computed<{ flag: string; label: string }>(() =>
  locale.value === 'ru'
    ? { flag: '\u{1F1F7}\u{1F1FA}', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439' }
    : { flag: '\u{1F1FA}\u{1F1F8}', label: 'English' },
)

const toggleLocale = (): void => {
  locale.value = locale.value === 'ru' ? 'en' : 'ru'
}

const goBack = (): void => {
  router.back()
}
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center gap-3 animate-fade-in-up">
      <Button variant="ghost" size="icon" class="shrink-0 h-8 w-8" @click="goBack">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-2xl font-bold tracking-wide">{{ $t('settings.title') }}</h1>
    </div>

    <Card class="glass" @click="toggleLocale">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center justify-between cursor-pointer">
          <div class="flex items-center gap-3">
            <Globe class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium">{{ $t('settings.language') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">{{ currentLanguage.flag }} {{ currentLanguage.label }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="glass">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Info class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium">{{ $t('settings.about') }}</span>
          </div>
          <span class="text-sm text-muted-foreground">v0.1.0</span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
