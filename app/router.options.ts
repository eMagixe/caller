import type { RouterConfig } from '@nuxt/schema'

export default {
	scrollBehavior(_to, _from, savedPosition) {
		return savedPosition || { top: 0 }
	}
} satisfies RouterConfig
