import { User } from '#shared/types'
import { UserService } from '#server/services'

export default defineEventHandler(async (event): Promise<User | void> => {
	try {
		const userService = new UserService()
		return await userService
			.getAll(event)
			.then((users): User[] => {
				return users
			})
			.catch((error) => {
				return error
			})
	} catch (error) {
		console.log(error)
	}
})
