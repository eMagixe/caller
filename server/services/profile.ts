import { H3Event } from 'h3'
import { BaseService } from '#server/services/base.ts'
import { ConfirmProfilePayload } from '#shared/types'

class ProfileService extends BaseService {
	public static instance: ProfileService | null = null

	static create() {
		if (this.instance) {
			return this.instance
		} else {
			this.instance = new ProfileService()
			return this.instance
		}
	}

	async getProfile(event: H3Event): Promise<User | null> {
		const token = this.tokenService.getToken(event)

		if (!token) {
			return null
		}

		return (await this.getRequest(event, '/profile')) as User
	}

	async confirmProfile(event: H3Event, payload: ConfirmProfilePayload): Promise<User> {
		return (await this.postRequest(event, '/profile/set-password', payload)) as User
	}
}

export const profileService: ProfileService = ProfileService.create()
