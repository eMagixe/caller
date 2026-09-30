import { authService, type AuthUserData, TokenService } from '#server/services'

export default defineEventHandler(async (event) => {
	try {
		const { username, password } = await readBody(event)

		if (!username || !password) {
			return { error: 'Username or password is missing' }
		}

		const tokenService: TokenService = TokenService.create()

		return await authService
			.login(username, password)
			.then((response: AuthUserData): AuthUserData => {
				if (!response.token) {
					throw new Error('Token is missing')
				}

				tokenService.setTokenToCookie(event, response.token)

				return {
					...response,
					token: 'created'
				}
			})
			.catch((error) => {
				return error
			})
	} catch (error) {
		console.log(error)
	}
})
