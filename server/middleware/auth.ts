import { defineEventHandler, H3Event, sendRedirect } from 'h3'
import { TokenService } from '#server/services'

export default defineEventHandler((event: H3Event) => {
	if (event.path.startsWith('/api') && !event.path.startsWith('/api/auth/login')) {
		const tokenService: TokenService = TokenService.create()
		const token = tokenService.getToken(event)
		if (!token) return sendRedirect(event, '/', 401)
	}
})
