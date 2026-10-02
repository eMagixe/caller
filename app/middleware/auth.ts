export default defineNuxtRouteMiddleware((to, from) => {
	const auth = useAuth()

	if (auth.isAuthenticated) {
		return
	} else {
		return navigateTo('/')
	}
})
