import webpush from 'web-push'

webpush.setVapidDetails('mailto:emax.mails@gmail.com', process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const { subscription, message } = body

	try {
		await webpush.sendNotification(
			subscription,
			JSON.stringify({
				title: 'Сигнал из Nuxt!',
				body: message
			})
		)
		return { success: true }
	} catch (error) {
		return { success: false, error: 'Непредвиденная ошибка' }
	}
})
