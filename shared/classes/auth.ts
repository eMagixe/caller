import { computed, type Ref } from 'vue'
import { navigateTo } from '#app'
import type { Nullable, User } from '#shared/types'

export type AuthState = {
	userData: Nullable<User>
}

enum UserRole {
	ADMIN = 'admin',
	USER = 'user'
}

export class Auth {
	readonly #state: Nullable<Ref<AuthState>> = null
	static #instance: Auth
	constructor(state: Ref<AuthState>) {
		this.#state = state
		if (Auth.#instance) {
			return Auth.#instance
		} else {
			Auth.#instance = this
		}
	}

	setUser = (userData: Nullable<User> = null) => {
		this.#state?.value && (this.#state.value.userData = userData)
	}

	getUser = (): Nullable<User> => {
		return this.#state?.value.userData || null
	}

	isAuth = computed(async (): Promise<Nullable<boolean>> => {
		if (!this.#state?.value.userData) {
			return false
		} else {
			if (this.has()) {
				return true
			} else {
				return await this.verify()
			}
		}
	})

	userIsAdmin = (user: unknown): user is User => {
		return (user as { role?: string })?.role === UserRole.ADMIN
	}

	userIsDefault = (user: unknown): user is User => {
		return (user as { role?: string })?.role === UserRole.USER
	}

	isAdminUser = computed(() => this.userIsAdmin(this.#state?.value.userData))
	isDefaultUser = computed(() => this.userIsDefault(this.#state?.value.userData))

	has = () => !!(this.#state?.value.userData && this.#state?.value.userData?.id)

	private verify = async (): Promise<Nullable<boolean>> => {
		try {
			return await $fetch('/api/v1/auth/me')
				.then((data) => {
					if (data) {
						return !!data
					} else {
						return false
					}
				})
				.catch(() => false)
		} catch (e) {
			console.error(e)
			return false
		}
	}

	getMe = async () => {
		try {
			return await $fetch('/api/v1/auth/me')
		} catch (e) {
			console.error(e)
			return null
		}
	}

	login = async (email: string, password: string) => {
		try {
			await $fetch('/api/v1/auth/login', {
				method: 'POST',
				body: {
					email,
					password
				}
			})
				.then((data) => {
					this.setUser(data as User)
				})
				.catch(() => {
					this.logout()
				})
		} catch (e) {
			console.error(e)
			await this.logout()
		}
	}

	private clearData = () => {
		this.setUser()
	}

	logout = async () => {
		await $fetch('/api/v1/auth/logout').then(() => {
			this.clearData()
			navigateTo('/login')
		})
	}
}
