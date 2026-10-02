// Позволяет TypeScript понимать контекст Service Worker
declare const self: ServiceWorkerGlobalScope

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

// 1. Обязательная строка для работы Vite PWA (сюда автоматически подставится кэш страниц)
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// 2. Слушаем событие 'push' (когда сервер прислал сигнал на телефон)
self.addEventListener('push', (event: PushEvent) => {
	// Проверяем, пришли ли данные от сервера
	let payload = { title: 'Новое уведомление', body: 'У вас новое сообщение!' }

	if (event.data) {
		try {
			payload = event.data.json()
		} catch (e) {
			// Если сервер прислал обычный текст вместо JSON
			payload.body = event.data.text()
		}
	}

	// Настройки пуш-уведомления для телефона
	const options: NotificationOptions = {
		body: payload.body,
		icon: '/pwa-192x192.png', // Иконка приложения в шторке
		badge: '/pwa-192x192.png', // Маленькая иконка для строки состояния (Android)
		data: {
			url: '/' // Ссылка по умолчанию, куда перейдет юзер при клике
		}
	}

	// Заставляем систему держать SW активным, пока показывается уведомление
	event.waitUntil(self.registration.showNotification(payload.title, options))
})

// 3. Слушаем клик по уведомлению (когда пользователь нажал на пуш в шторке)
self.addEventListener('notificationclick', (event: NotificationEvent) => {
	// Закрываем пуш, чтобы он не висел в шторке после клика
	event.notification.close()

	// Открываем сайт при клике
	const targetUrl = event.notification.data?.url || '/'

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			// Если сайт уже открыт в какой-то вкладке, переключаемся на нее
			for (const client of clientList) {
				if ('focus' in client) {
					return client.focus()
				}
			}
			// Если сайт закрыт, открываем новую вкладку
			if (self.clients.openWindow) {
				return self.clients.openWindow(targetUrl)
			}
		})
	)
})
