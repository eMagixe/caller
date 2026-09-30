import { type User } from '#shared/types'

export const useProfile = () => {
	const state = useState<User | null>('profile', () => null)

	const isLocalSession = typeof sessionStorage !== 'undefined'

	async function getUser() {
		if (state.value === null) {
			state.value = await getSessionUser()
		}
		return state.value
	}

	function setUserToSession(user: User) {
		sessionStorage.setItem('user', JSON.stringify(user))
	}

	async function getSessionUser() {
		if (isLocalSession) {
			const stringSessionUser = sessionStorage.getItem('user')
			if (stringSessionUser) return JSON.parse(stringSessionUser)
			else {
				return await $fetch('/api/profile')
					.then((data): User | null => {
						if (data) {
							setUserToSession(data as User)
							return data as User
						}
						return null
					})
					.catch(() => {
						return null
					})
			}
		} else return null
	}

	return { state, getUser, setUserToSession }
}
