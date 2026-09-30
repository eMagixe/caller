import { type User } from '#shared/types'

export const useUser = () => {
	const state = useState<User | null>('user', () => null)

	async function getById(id: string) {
		await $fetch(`/api/users/${id}`)
	}

	async function create(payload: CreateUserPayload) {
		await $fetch('/api/users/create', {
			method: 'POST',
			body: {
				...payload
			}
		})
	}

	async function getAll() {
		return (await $fetch(`/api/users`)) as User[]
	}

	return { state, getById, getAll, create }
}
