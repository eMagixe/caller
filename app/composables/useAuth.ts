import { type User } from '#shared/types'
import { useProfile } from '~/composables/useProfile.ts'

export const useAuth = () => {
	const profile = useProfile()

	const isAuthenticated = computed(async () => (await profile.getUser()) !== null)

	async function login(username: string, password: string): Promise<boolean> {
		return await $fetch('api/auth/login', { method: 'POST', body: { username, password } })
			.then((data: unknown) => {
				profile.setUserToSession(data as User)
				return Promise.resolve(true)
			})
			.catch((): Promise<boolean> => {
				return Promise.reject(false)
			})
	}

	async function logout() {
		sessionStorage.removeItem('user')
		await $fetch('/api/auth/logout').then(() => {
			navigateTo('/')
		})
	}

	return { isAuthenticated, login, logout }
}
