import { createHmac } from 'node:crypto'
import { apiError, sessionFor } from '../../../utils/security'

export default defineEventHandler((event) => {
	try {
		const { member } = sessionFor(event)
		if (!member.approved) throw createError({ statusCode: 403, message: 'Дождитесь разрешения организатора.' })
		const config = useRuntimeConfig()
		const iceServers: { urls: string[]; username?: string; credential?: string }[] = []
		const stunUrls = config.stunUrls
			.split(',')
			.map((url) => url.trim())
			.filter(Boolean)
		if (stunUrls.length) iceServers.push({ urls: stunUrls })
		if (config.turnUrls && config.turnSecret) {
			const username = `${Math.floor(Date.now() / 1000) + 43_200}:${member.id}`
			iceServers.push({
				urls: config.turnUrls
					.split(',')
					.map((url) => url.trim())
					.filter(Boolean),
				username,
				credential: createHmac('sha1', config.turnSecret).update(username).digest('base64')
			})
		}
		return { iceServers, hasTurn: Boolean(config.turnUrls && config.turnSecret) }
	} catch (error) {
		apiError(error)
	}
})
