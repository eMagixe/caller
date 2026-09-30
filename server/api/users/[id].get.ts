import { User } from '#shared/types'
import { UserService } from '#server/services'

export default defineEventHandler(async (event): Promise<User | void> => {
	try {
		const userService = new UserService()

		const id = getRouterParam(event, 'id')

		if (!id) return

		return await userService
			.getById(event, id as string)
			.then((user) => {
				return user
			})
			.catch((error) => {
				return error
			})
	} catch (error) {
		console.log(error)
	}
})
