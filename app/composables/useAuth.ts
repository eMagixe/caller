import { type User } from '#shared/types'
import { useProfile } from '~/composables/useProfile.ts'

export const useAuth = () => {
	const state = useState<User | null>('user', () => null)
	const profile = useProfile()

	const isLocalSession = typeof sessionStorage !== 'undefined'
	const isAuthenticated = computed(async () => (await profile.getUser()) !== null)

	async function login(username: string, password: string): Promise<boolean> {
		return await $fetch('api/auth/login', { method: 'POST', body: { username, password } })
			.then((data: unknown) => {
				state.value = data as User
				profile.setUserToSession(state.value)
				return Promise.resolve(true)
			})
			.catch((): Promise<boolean> => {
				state.value = null
				return Promise.reject(false)
			})
	}

	function logout() {
		state.value = null
		isLocalSession && sessionStorage.removeItem('user')
		navigateTo('/')
	}

	return { state, isAuthenticated, login, logout }
}
