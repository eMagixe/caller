import { User } from '#shared/types'
import { profileService } from '#server/services'

export default defineEventHandler(async (event): Promise<User | void> => {
	try {
		const payload = await readBody(event)

		return await profileService.confirmProfile(event, payload).catch((error) => {
			return error
		})
	} catch (error) {
		console.log(error)
	}
})
