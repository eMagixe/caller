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

export type ConfirmProfilePayload = {
	email: string
	password: string
	code: string
}

export type UserRole = 'admin' | 'user'
