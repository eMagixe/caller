import { H3Event } from 'h3'
import { TokenService } from '#server/services/token'

export class BaseService {
	protected readonly baseUrl: string = ''
	protected readonly tokenService: TokenService = TokenService.create()

	constructor() {
		const config = useRuntimeConfig()
		this.baseUrl = config.authServer
	}

	getToken(event: H3Event): string {
		const token: string = this.tokenService.getToken(event)

		if (!token) {
			throw createError({
				statusCode: 401,
				statusMessage: 'Unauthorized'
			})
		}

		return token
	}

	setOptions(event: H3Event) {
		return {
			baseURL: this.baseUrl,
			headers: {
				Authorization: `Bearer ${this.getToken(event)}`
			}
		}
	}

	async getRequest(event: H3Event, url: string) {
		return await $fetch(url, {
			method: 'GET',
			...this.setOptions(event)
		})
	}

	async postRequest(event: H3Event, url: string, payload: object) {
		return await $fetch(url, {
			method: 'POST',
			body: {
				...payload
			},
			...this.setOptions(event)
		})
	}
}
