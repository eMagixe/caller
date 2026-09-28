import type { RouterConfig } from '@nuxt/schema'

export default {
  // Invitation fragments contain credentials, not element IDs. Never hand them to a selector.
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  },
} satisfies RouterConfig
