import { getCookie, H3Event, setCookie } from 'h3'

export class TokenService {
	public static instance: TokenService | null = null

	static create() {
		if (this.instance) {
			return this.instance
		} else {
			this.instance = new TokenService()
			return this.instance
		}
	}

	setTokenToCookie(e: H3Event, token: string): void {
		setCookie(e, 'token', token, { maxAge: 60 * 60 * 24 * 30, httpOnly: true, secure: true })
	}

	getTokenFromCookie(e: H3Event): string | null | undefined {
		return getCookie(e, 'token')
	}

	getToken(event: H3Event): boolean | string {
		if (event) {
			const tokenController = TokenService.create()
			const token = tokenController.getTokenFromCookie(event)

			if (typeof token === 'string' && token.length > 0) {
				return token
			} else {
				return false
			}
		}
		return false
	}
}
