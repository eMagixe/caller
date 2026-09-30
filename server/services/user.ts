import { H3Event } from 'h3'
import { BaseService } from '#server/services/base.ts'

export class UserService extends BaseService {
	async getById(event: H3Event, id: string): Promise<User> {
		return (await this.getRequest(event, `/users/${id}`)) as User
	}

	async getAll(event: H3Event): Promise<User[]> {
		return (await this.getRequest(event, `/users`)) as User[]
	}

	async create(event: H3Event, payload: CreateUserPayload): Promise<User> {
		return (await this.postRequest(event, '/users', payload)) as User
	}
}
