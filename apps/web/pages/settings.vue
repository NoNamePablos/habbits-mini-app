<script setup lang="ts">
import { ArrowLeft, Globe, Info, Bell, Palette, Trash2, MessageCircle, Calendar, Download, MoonStar } from 'lucide-vue-next'
import { Switch } from '~/components/ui/switch'

type ThemePreference = 'auto' | 'light' | 'dark'

interface NotificationPreferences {
  morningEnabled: boolean
  eveningEnabled: boolean
  morningTime: string
  eveningTime: string
  dndEnabled: boolean
  dndStart: string
  dndEnd: string
}

const router = useRouter()
const api = useApi()
const { locale } = useI18n()
const { handleError } = useErrorHandler()
const authStore = useAuthStore()
const { hapticNotification, tg } = useTelegram()
const { preference: themePref, setPreference: setThemePref } = useThemePreference()
const config = useRuntimeConfig()
const { startsMonday, setStartsMonday } = useWeekStart()

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

const themeOptions: { value: ThemePreference; labelKey: string }[] = [
  { value: 'auto', labelKey: 'settings.themeAuto' },
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'dark', labelKey: 'settings.themeDark' },
]

const { showSuccess } = useErrorHandler()

const onFeedback = (): void => {
  ;(tg as unknown as { openLink: (url: string) => void })?.openLink(config.public.feedbackUrl as string)
}

const onDndToggle = (checked: boolean): void => {
  updatePreference({ dndEnabled: checked })
}

const onDndStartChange = (event: Event): void => {
  const target = event.target as HTMLInputElement
  updatePreference({ dndStart: target.value })
}

const onDndEndChange = (event: Event): void => {
  const target = event.target as HTMLInputElement
  updatePreference({ dndEnd: target.value })
}

const isSendingTest = ref<boolean>(false)
const onTestNotification = async (): Promise<void> => {
  isSendingTest.value = true
  try {
    await api.post('/notifications/test')
    showSuccess('success.testNotificationSent')
  } finally {
    isSendingTest.value = false
  }
}

const habitsStore = useHabitsStore()
const challengesStore = useChallengesStore()
const gamificationStore = useGamificationStore()

const onExportData = (): void => {
  const data = {
    exportedAt: new Date().toISOString(),
    habits: toValue(habitsStore.habits),
    challenges: toValue(challengesStore.challenges),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `habits-export-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const onDeleteAccount = async (): Promise<void> => {
  const success = await authStore.deleteAccount()
  if (success) {
    hapticNotification('warning')
    if (tg?.close) {
      tg.close()
    } else {
      window.location.reload()
    }
  }
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

    <Card class="glass" @click="void setStartsMonday(!startsMonday)">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center justify-between cursor-pointer">
          <div class="flex items-center gap-3">
            <Calendar class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium">{{ $t('settings.weekStart') }}</span>
          </div>
          <span class="text-sm text-muted-foreground">
            {{ startsMonday ? $t('settings.weekStartMon') : $t('settings.weekStartSun') }}
          </span>
        </div>
      </CardContent>
    </Card>

    <Card class="glass">
      <CardContent class="pt-4 pb-4 space-y-3">
        <div class="flex items-center gap-2">
          <Palette class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-semibold">{{ $t('settings.theme') }}</span>
        </div>
        <div class="flex gap-2">
          <Button
            v-for="option in themeOptions"
            :key="option.value"
            :variant="themePref === option.value ? 'default' : 'outline'"
            size="sm"
            class="flex-1"
            @click="void setThemePref(option.value)"
          >
            {{ $t(option.labelKey) }}
          </Button>
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
              <Input
                v-if="notifPrefs.morningEnabled"
                type="time"
                :value="notifPrefs.morningTime"
                class="h-8 w-22 text-xs text-center px-2"
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
              <Input
                v-if="notifPrefs.eveningEnabled"
                type="time"
                :value="notifPrefs.eveningTime"
                class="h-8 w-22 text-xs text-center px-2"
                @change="onEveningTimeChange"
              />
              <Switch
                :checked="notifPrefs.eveningEnabled"
                @update:checked="onEveningToggle"
              />
            </div>
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 flex-1">
              <MoonStar class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium">{{ $t('settings.dnd') }}</span>
            </div>
            <Switch
              :checked="notifPrefs.dndEnabled"
              @update:checked="onDndToggle"
            />
          </div>
          <div v-if="notifPrefs.dndEnabled" class="flex items-center gap-4 pl-6">
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">{{ $t('settings.dndStart') }}</span>
              <Input type="time" :value="notifPrefs.dndStart" class="h-8 w-22 text-xs text-center px-2" @change="onDndStartChange" />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">{{ $t('settings.dndEnd') }}</span>
              <Input type="time" :value="notifPrefs.dndEnd" class="h-8 w-22 text-xs text-center px-2" @change="onDndEndChange" />
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          class="w-full text-xs"
          :disabled="isSendingTest"
          @click="onTestNotification"
        >
          <Bell class="h-3.5 w-3.5 mr-2" />
          {{ $t('settings.testNotification') }}
        </Button>
      </CardContent>
    </Card>

    <Card class="glass" @click="onFeedback">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center gap-3 cursor-pointer">
          <MessageCircle class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ $t('settings.feedback') }}</span>
        </div>
      </CardContent>
    </Card>

    <Card class="glass" @click="onExportData">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center gap-3 cursor-pointer">
          <Download class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ $t('settings.exportData') }}</span>
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
          <span class="text-sm text-muted-foreground">v{{ config.public.appVersion }}</span>
        </div>
      </CardContent>
    </Card>

    <Card class="glass border-destructive/20">
      <CardContent class="pt-4 pb-4">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <div class="flex items-center gap-3 cursor-pointer">
              <Trash2 class="h-4 w-4 text-destructive" />
              <span class="text-sm font-medium text-destructive">{{ $t('settings.deleteAccount') }}</span>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent class="glass-heavy">
            <AlertDialogHeader>
              <AlertDialogTitle>{{ $t('settings.deleteAccountTitle') }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ $t('settings.deleteAccountDescription') }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ $t('settings.cancel') }}</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground" @click="onDeleteAccount">
                {{ $t('settings.deleteAccountConfirm') }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  </div>
</template>

