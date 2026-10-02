import type { NuxtPage } from 'nuxt/schema'

export default defineNuxtConfig({
	compatibilityDate: '2026-09-01',
	modules: ['@nuxt/ui', '@vite-pwa/nuxt'],
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
		stunUrls: '',
		authServer: ''
	},
	pwa: {
		strategies: 'injectManifest',
		srcDir: 'service-worker',
		filename: 'sw.ts',
		manifest: {
			name: 'Caller - Звони с друзьями',
			short_name: 'Caller',
			theme_color: '#ffffff',
			icons: [
				{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
				{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
			]
		}
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
	},
	hooks: {
		'pages:extend'(pages) {
			const setMiddleware = (pages: NuxtPage[]) => {
				for (const page of pages) {
					if (page.path.startsWith('/dashboard')) {
						page.meta ||= {}
						page.meta.middleware = ['auth']
					}
					if (page.children) {
						setMiddleware(page.children)
					}
				}
			}

			setMiddleware(pages)
		}
	}
})
