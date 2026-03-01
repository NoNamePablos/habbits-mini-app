// Redirects new users to /welcome on first launch.
// Source of truth: authStore.isNewUser (from backend, zero-cost — already computed in findOrCreateFromTelegram)
// Fast-path cache: localStorage 'onboarding_seen_welcome' avoids flicker while auth loads

export default defineNuxtRouteMiddleware(async (to) => {
  // Fast-path: if localStorage says "already seen", skip redirect immediately
  let lsSeen = false
  try { lsSeen = localStorage.getItem('onboarding_seen_welcome') === 'true' } catch { /* noop */ }

  if (lsSeen && to.path === '/welcome') return navigateTo('/')
  if (lsSeen) return

  // Wait for auth to complete (authenticate() is called in default.vue onMounted)
  // Middleware runs before auth for cold starts — in that case we rely on localStorage only.
  // If localStorage was cleared but user isn't new, the welcome page will redirect via its own logic.
  const authStore = useAuthStore()

  // If auth already completed, use backend result
  if (authStore.isAuthenticated) {
    const hasSeenWelcome = authStore.user?.settings?.seenFlags?.includes('welcome') ?? false
    // Only redirect if genuinely a new user — skip for old accounts that predate seenFlags
    if (!hasSeenWelcome && authStore.isNewUser && to.path !== '/welcome' && to.path !== '/onboarding') {
      return navigateTo('/welcome')
    }
    if (hasSeenWelcome && to.path === '/welcome') {
      return navigateTo('/')
    }
    return
  }

  // Auth not yet loaded — allow navigation; welcome.vue will handle the redirect after auth
})
