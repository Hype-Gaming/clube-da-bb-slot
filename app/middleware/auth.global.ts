export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  const { hydrate, loggedIn } = useAuth()
  hydrate()
  const isLogin = to.path === '/auth/login'
  if (!loggedIn.value && !isLogin) return navigateTo('/auth/login')
  if (loggedIn.value && isLogin) return navigateTo('/')
})
