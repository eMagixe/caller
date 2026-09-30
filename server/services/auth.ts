import { User } from '#shared/types'
import { TokenService } from '#server/services/token'

export type AuthUserData = User & {
	token: string
}

class AuthService {
	private readonly baseUrl: string = ''
	private readonly tokenService: TokenService = TokenService.create()
	public static instance: AuthService | null = null

	constructor() {
		const config = useRuntimeConfig()
		this.baseUrl = config.authServer
	}

	static create() {
		if (this.instance) {
			return this.instance
		} else {
			this.instance = new AuthService()
			return this.instance
		}
	}

	async login(username: string, password: string): Promise<AuthUserData> {
		return await $fetch('/auth/login', {
			method: 'POST',
			baseURL: this.baseUrl,
			body: {
				email: username,
				password
			}
		})
	}
}

export const authService: AuthService = AuthService.create()
