import { profileService } from '#server/services'
import { User } from '#shared/types'

export default defineEventHandler(async (event): Promise<User | null> => {
	try {
		return await profileService
			.getProfile(event)
			.then((response: User | null): User | null => {
				return response
			})
			.catch((error) => {
				console.log(error)
				return null
			})
	} catch (error) {
		console.log(error)
		return null
	}
})
