import { z } from 'zod'
import { apiError, cookieName, guardMutation, nameSchema, roomIdSchema, saveSession } from '../../../utils/security'
import { roomStore } from '../../../utils/room-store'

export default defineEventHandler(async (event) => {
	guardMutation(event)
	try {
		const id = roomIdSchema.parse(getRouterParam(event, 'id'))
		const data = z.object({ name: nameSchema, invite: z.string().min(40).max(100) }).parse(await readBody(event))
		const existing = getCookie(event, cookieName(id))
		if (existing) {
			try {
				const { room, member } = roomStore.authenticate(id, existing)
				return roomStore.snapshot(room, member)
			} catch {
				/* An invalid or revoked cookie must not prevent using a new invitation. */
			}
		}
		const { room, member, session } = roomStore.join(id, data.invite, data.name)
		saveSession(event, id, session)
		return roomStore.snapshot(room, member)
	} catch (error) {
		apiError(error)
	}
})
