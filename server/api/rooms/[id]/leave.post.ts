import { apiError, cookieName, guardMutation, sessionFor } from '../../../utils/security'
import { roomStore } from '../../../utils/room-store'

export default defineEventHandler((event) => {
  guardMutation(event)
  try {
    const { room, member } = sessionFor(event)
    roomStore.leave(room, member)
    deleteCookie(event, cookieName(room.id), { path: `/api/rooms/${room.id}` })
    return { ok: true }
  } catch (error) { apiError(error) }
})
