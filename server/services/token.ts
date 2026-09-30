import { deleteCookie, getCookie, H3Event, setCookie } from 'h3'

export class TokenService {
	protected static instance: TokenService | null = null
	private cookieOptions = { maxAge: 60 * 60 * 24, httpOnly: true, secure: true }

	static create() {
		if (this.instance) {
			return this.instance
		} else {
			this.instance = new TokenService()
			return this.instance
		}
	}

	setTokenToCookie(event: H3Event, token: string): void {
		deleteCookie(event, 'token')
		setCookie(event, 'token', token, this.cookieOptions)
	}

	getTokenFromCookie(event: H3Event): string | null | undefined {
		return getCookie(event, 'token')
	}

	removeTokenFromCookie(event: H3Event): void {
		deleteCookie(event, 'token')
	}

	getToken(event: H3Event): string {
		if (event) {
			const tokenController = TokenService.create()
			const token = tokenController.getTokenFromCookie(event)

			if (typeof token === 'string' && token.length > 0) {
				return token
			} else {
				return ''
			}
		}
		return ''
	}
}
