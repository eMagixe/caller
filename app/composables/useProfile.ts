import { type ConfirmProfilePayload, type User } from '#shared/types'

export const useProfile = () => {
	const state = useState<User | null>('profile', () => null)

	async function getUser() {
		if (state.value === null) {
			state.value = await getSessionUser()
		}
		return state
	}

	function setUserToSession(user: User) {
		state.value = user
		sessionStorage.setItem('user', JSON.stringify(user))
	}

	async function getSessionUser() {
		if (import.meta.client) {
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
					.catch((error) => {
						console.log(error)
						navigateTo('/')
					})
			}
		} else navigateTo('/')
	}

	async function confirmProfile(payload: ConfirmProfilePayload) {
		return await $fetch('/api/profile/confirm', {
			method: 'POST',
			body: { ...payload }
		})
	}

	return { getUser, setUserToSession, confirmProfile }
}
