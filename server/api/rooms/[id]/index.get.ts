import { apiError, sessionFor } from '../../../utils/security'
import { roomStore } from '../../../utils/room-store'

export default defineEventHandler((event) => {
  try {
    const { room, member } = sessionFor(event)
    return roomStore.snapshot(room, member)
  } catch (error) { apiError(error) }
})
