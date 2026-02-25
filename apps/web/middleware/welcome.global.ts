export default defineNuxtRouteMiddleware((to) => {
  const STORAGE_KEY = 'onboarding_seen_welcome'

  let hasSeenWelcome = false
  try {
    hasSeenWelcome = localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    hasSeenWelcome = false
  }

  if (!hasSeenWelcome && to.path !== '/welcome') {
    return navigateTo('/welcome')
  }

  if (hasSeenWelcome && to.path === '/welcome') {
    return navigateTo('/')
  }
})
