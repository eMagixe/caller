import { User } from '#shared/types'
import { UserService } from '#server/services'

export default defineEventHandler(async (event): Promise<User | void> => {
	try {
		const userService = new UserService()
		const payload = (await readBody(event)) as CreateUserPayload

		return await userService
			.create(event, payload)
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
