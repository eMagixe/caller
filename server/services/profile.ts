import { H3Event } from 'h3'
import { TokenService } from '#server/services/token'

class ProfileService {
	private readonly server: string = ''
	private readonly tokenService: TokenService = TokenService.create()
	public static instance: ProfileService | null = null

	constructor() {
		const config = useRuntimeConfig()
		this.server = config.authServer
	}

	static create() {
		if (this.instance) {
			return this.instance
		} else {
			this.instance = new ProfileService()
			return this.instance
		}
	}

	async getProfile(event: H3Event): Promise<User> {
		const token = this.tokenService.getToken(event)

		if (!token) {
			throw createError({
				statusCode: 401,
				statusMessage: 'Unauthorized'
			})
		}

		return await $fetch('/profile', {
			method: 'GET',
			baseURL: this.server,
			headers: {
				Authorization: `Bearer ${token}`
			}
		})
	}
}

export const profileService: ProfileService = ProfileService.create()
