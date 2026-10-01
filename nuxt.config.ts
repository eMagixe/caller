export default defineNuxtConfig({
	compatibilityDate: '2026-09-01',
	modules: ['@nuxt/ui'],
	ui: { fonts: false },
	css: ['~/assets/css/main.css'],
	devtools: { enabled: false },
	ssr: false,
	colorMode: {
		preference: 'light',
		fallback: 'light',
		dataValue: 'theme',
		storageKey: 'nuxt-color-mode'
	},
	nitro: {
		preset: 'node-server',
		experimental: { websocket: true }
	},
	runtimeConfig: {
		appOrigin: '',
		trustProxy: false,
		turnUrls: '',
		turnSecret: '',
		stunUrls: 'stun:stun.cloudflare.com:3478',
		authServer: 'https://caller-backend-qox8ww-9592ad-46-191-166-245.sslip.io'
	},
	app: {
		head: {
			htmlAttrs: { lang: 'ru' },
			title: 'Caller — ближе, даже на расстоянии',
			meta: [
				{
					name: 'description',
					content: 'Приватные видео- и аудиозвонки. Одна ссылка, один собеседник, ваш разговор.'
				}
			],
			link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
		}
	}
})
