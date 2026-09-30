import { profileService } from '#server/services'
import { User } from '#shared/types'

export default defineEventHandler(async (event): Promise<User | void> => {
	try {
		return await profileService
			.getProfile(event)
			.then((response: User): User => {
				return response
			})
			.catch((error) => {
				return error
			})
	} catch (error) {
		console.log(error)
	}
})
