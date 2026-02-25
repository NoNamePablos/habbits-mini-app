<script setup lang="ts">
import { ArrowLeft, Globe, Info, Bell } from 'lucide-vue-next'
import { Switch } from '~/components/ui/switch'

interface NotificationPreferences {
  morningEnabled: boolean
  eveningEnabled: boolean
  morningTime: string
  eveningTime: string
}

const router = useRouter()
const api = useApi()
const { locale } = useI18n()
const { handleError } = useErrorHandler()

const currentLanguage = computed<{ flag: string; label: string }>(() =>
  locale.value === 'ru'
    ? { flag: '🇷🇺', label: 'Русский' }
    : { flag: '🇺🇸', label: 'English' },
)

const notifPrefs = ref<NotificationPreferences | null>(null)
const notifLoading = ref<boolean>(true)

onMounted(async () => {
  try {
    notifPrefs.value = await api.get<NotificationPreferences>('/notifications/preferences')
  } catch (error: unknown) {
    handleError(error, 'errors.fetchProfile')
  } finally {
    notifLoading.value = false
  }
})

const updatePreference = async (data: Partial<NotificationPreferences>): Promise<void> => {
  try {
    notifPrefs.value = await api.patch<NotificationPreferences>('/notifications/preferences', data)
  } catch (error: unknown) {
    handleError(error, 'errors.unknown')
  }
}

const onMorningToggle = (checked: boolean): void => {
  updatePreference({ morningEnabled: checked })
}

const onEveningToggle = (checked: boolean): void => {
  updatePreference({ eveningEnabled: checked })
}

const onMorningTimeChange = (event: Event): void => {
  const target = event.target as HTMLInputElement
  updatePreference({ morningTime: target.value })
}

const onEveningTimeChange = (event: Event): void => {
  const target = event.target as HTMLInputElement
  updatePreference({ eveningTime: target.value })
}

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

    <Card v-if="notifPrefs" class="glass">
      <CardContent class="pt-4 pb-4 space-y-4">
        <div class="flex items-center gap-2">
          <Bell class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-semibold">{{ $t('settings.notifications') }}</span>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <span class="text-sm font-medium">{{ $t('settings.morningReminder') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-if="notifPrefs.morningEnabled"
                type="time"
                :value="notifPrefs.morningTime"
                class="time-input"
                @change="onMorningTimeChange"
              />
              <Switch
                :checked="notifPrefs.morningEnabled"
                @update:checked="onMorningToggle"
              />
            </div>
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="flex-1">
              <span class="text-sm font-medium">{{ $t('settings.eveningReminder') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-if="notifPrefs.eveningEnabled"
                type="time"
                :value="notifPrefs.eveningTime"
                class="time-input"
                @change="onEveningTimeChange"
              />
              <Switch
                :checked="notifPrefs.eveningEnabled"
                @update:checked="onEveningToggle"
              />
            </div>
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

<style lang="scss" scoped>
.time-input {
  background: transparent;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  color: hsl(var(--foreground));
  width: 5.5rem;
  text-align: center;

  &::-webkit-calendar-picker-indicator {
    filter: invert(0.5);
  }
}
</style>
