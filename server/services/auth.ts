import { User } from '#shared/types'
import { BaseService } from '#server/services/base.ts'

export type AuthUserData = User & {
	token: string
}

class AuthService extends BaseService {
	public static instance: AuthService | null = null

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
