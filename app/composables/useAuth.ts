import { useStorage } from '@vueuse/core'
import { Auth, type AuthState } from '#shared/classes/auth'

const state = useStorage<AuthState>('auth', { userData: null }, sessionStorage, { mergeDefaults: true })

export const useAuth = () => {
	return new Auth(state)
}
