import { z } from 'zod'
import { apiError, clientIp, guardMutation, limit, nameSchema, saveSession } from '../../utils/security'
import { roomStore } from '../../utils/room-store'

export default defineEventHandler(async (event) => {
  guardMutation(event)
  limit(`create:${clientIp(event)}`, 10)
  try {
    const data = z.object({ name: nameSchema, title: z.string().trim().min(1).max(80), mode: z.enum(['video', 'audio']) }).parse(await readBody(event))
    const { room, member, session, invite } = roomStore.create(data.name, data.title, data.mode)
    saveSession(event, room.id, session)
    return { room: roomStore.snapshot(room, member), invite }
  } catch (error) { apiError(error) }
})
