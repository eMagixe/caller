import { apiError, guardMutation, sessionFor } from '../../../utils/security'
import { roomStore } from '../../../utils/room-store'

export default defineEventHandler((event) => {
  guardMutation(event)
  try {
    const { room, member } = sessionFor(event)
    return { invite: roomStore.invite(room, member) }
  } catch (error) { apiError(error) }
})
