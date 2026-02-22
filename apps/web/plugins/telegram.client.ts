import type { TelegramWebApp } from '~/types/telegram'

export default defineNuxtPlugin((): { provide: { telegram: TelegramWebApp | undefined } } => {
  const tg = window.Telegram?.WebApp

  if (tg) {
    tg.ready()
    tg.expand()
    tg.enableClosingConfirmation()

    const languageCode = tg.initDataUnsafe?.user?.language_code
    if (languageCode) {
      const i18n = useNuxtApp().$i18n as { locale: { value: string } }
      i18n.locale.value = languageCode === 'ru' ? 'ru' : 'en'
    }
  }

  return {
    provide: {
      telegram: tg,
    },
  }
})
