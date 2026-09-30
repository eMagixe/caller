export type User = {
	id: string
	email: string
	firstName: string
	lastName: string
	role: UserRole
}

export type CreateUserPayload = {
	email: string
	firstName: string
	lastName: string
	role: UserRole
}

export type UserRole = 'admin' | 'user'
