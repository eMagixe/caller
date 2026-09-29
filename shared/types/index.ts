export type User = {
	readonly id: string
	readonly role: Role
	name: string
	avatar?: {
		src: string
		alt: string
	}
}

export type Nullable<T> = T | null

export type UserPayload = {
	readonly id?: string
	readonly role: Role
	first_name: string
	last_name: string
	phone?: string
	email?: string
	password?: string
}

export type TimeOrder = {
	start: string
	end: string
}

export type Order = {
	readonly id?: string
	readonly created_at?: string
	products: Product[]
	time: TimeOrder
	description: string
	date: string
	user_id: string
}

export type Product = {
	readonly id?: string
	readonly created_at?: string
	selected?: boolean
	name: string
	description: string
	price: number
	type: string
	status: boolean
	time: number
}

export type Role = 'admin' | 'user'
