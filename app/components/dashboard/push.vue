<script setup>
import { ref } from 'vue'

const messageText = ref('Привет, это тестовый сигнал!')
const userSubscription = ref(null)

// 1. Функция для подписки телефона на пуши
const subscribeUser = async () => {
	if (!process.client) return

	try {
		// Проверяем поддержку
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			alert('Пуши не поддерживаются вашим браузером')
			return
		}

		// Запрашиваем разрешение у пользователя
		const permission = await Notification.requestPermission()
		if (permission !== 'granted') {
			alert('Вы запретили уведомления')
			return
		}

		// Ждем, пока Service Worker будет готов (он должен быть настроен через PWA модуль)
		const registration = await navigator.serviceWorker.ready

		// Подписываем пользователя
		// Замените СТРОКУ ниже на ваш реальный публичный VAPID ключ!
		const publicVapidKey = process.env.VAPID_PUBLIC_KEY

		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: publicVapidKey
		})

		// Сохраняем подписку в реактивную переменную (в реальном приложении её нужно сохранить в БД)
		userSubscription.value = subscription
		alert('Телефон успешно подписан!')
	} catch (error) {
		console.error('Ошибка при подписке:', error)
	}
}

// 2. Функция ОБРАЩЕНИЯ к вашему серверному эндпоинту
const sendPushNotification = async () => {
	if (!userSubscription.value) {
		alert('Сначала подпишите телефон с помощью кнопки выше!')
		return
	}

	try {
		// Делаем POST-запрос к файлу server/api/send-push.ts
		const response = await $fetch('/api/send-push', {
			method: 'POST',
			body: {
				subscription: userSubscription.value, // Передаем объект подписки телефона
				message: messageText.value // Текст из инпута
			}
		})

		if (response.success) {
			alert('Сервер успешно отправил пуш!')
		} else {
			alert('Ошибка на сервере: ' + response.error)
		}
	} catch (error) {
		console.error('Ошибка при отправке запроса:', error)
	}
}
</script>

<template>
	<div class="push-container">
		<!-- Шаг 1: Подписка (делается один раз пользователем) -->
		<UButton @click="subscribeUser">Принимать звонки</UButton>

		<!-- Шаг 2: Отправка (можно вызывать когда угодно) -->
		<div v-if="userSubscription">
			<UInput v-model="messageText" type="text" placeholder="Введите текст сигнала" />
			<UButton @click="sendPushNotification">Отправить</UButton>
		</div>
	</div>
</template>

<style scoped>
.push-container {
	padding: 5px;
}
</style>
