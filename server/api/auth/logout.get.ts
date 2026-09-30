import { TokenService } from '#server/services'

export default defineEventHandler(async (event) => {
	try {
		const tokenService: TokenService = TokenService.create()
		tokenService.removeTokenFromCookie(event)
	} catch (error) {
		console.log(error)
	}
})
