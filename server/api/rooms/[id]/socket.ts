import { z } from 'zod'
import { cookieName, expectedOrigin, limit } from '../../../utils/security'
import { RoomError, roomStore } from '../../../utils/room-store'

const signalSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('approve'), participantId: z.uuid() }),
  z.object({ type: z.literal('reject'), participantId: z.uuid() }),
  z.object({ type: z.literal('ready') }),
  z.object({ type: z.literal('ping') }),
  z.object({ type: z.literal('leave') }),
  z.object({ type: z.literal('end') }),
  z.object({ type: z.literal('media'), audio: z.boolean(), video: z.boolean() }),
  z.object({ type: z.literal('signal'),
    description: z.object({ type: z.enum(['offer', 'answer']), sdp: z.string().max(64_000) }).optional(),
    candidate: z.object({ candidate: z.string().max(4096), sdpMid: z.string().max(128).nullable().optional(), sdpMLineIndex: z.number().int().min(0).max(32).nullable().optional(), usernameFragment: z.string().max(256).nullable().optional() }).optional(),
  }).refine(value => Boolean(value.description) !== Boolean(value.candidate)),
])

function authenticate(request: { url: string; headers: Headers }) {
  const url = new URL(request.url)
  if (request.headers.get('origin') !== expectedOrigin(request.url)) throw new RoomError(403, 'Недопустимый источник.')
  const id = url.pathname.split('/')[3] || ''
  const prefix = `${cookieName(id)}=`
  const cookie = request.headers.get('cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith(prefix))?.slice(prefix.length)
  return roomStore.authenticate(id, cookie)
}

export default defineWebSocketHandler({
  upgrade(request) {
    try { authenticate(request) }
    catch { return new Response('Forbidden', { status: 403 }) }
  },
  open(peer) {
    try {
      const { room, member } = authenticate(peer.request)
      limit(`connect:${member.id}`, 30)
      roomStore.connect(room, member, peer)
    } catch { peer.close(4003, 'Forbidden') }
  },
  message(peer, message) {
    try {
      if (message.text().length > 70_000) return peer.close(1009, 'Message too large')
      const { room, member } = authenticate(peer.request)
      if (member.connection?.id !== peer.id) return peer.close(4001, 'Session replaced')
      limit(`ws:${member.id}`, 300)
      const data = signalSchema.parse(message.json())
      switch (data.type) {
        case 'ping': peer.send({ type: 'pong' }); break
        case 'ready': roomStore.ready(room, member); break
        case 'approve': roomStore.approve(room, member, data.participantId); break
        case 'reject': roomStore.reject(room, member, data.participantId); break
        case 'leave': roomStore.leave(room, member); break
        case 'end':
          if (member.role !== 'host') throw new RoomError(403, 'Доступно только организатору.')
          roomStore.end(room, 'Организатор завершил звонок.'); break
        case 'signal': case 'media': roomStore.relay(room, member, data); break
      }
    } catch (error) {
      peer.send({ type: 'error', message: error instanceof RoomError ? error.message : 'Некорректный запрос или превышен лимит сообщений.' })
      if (error instanceof RoomError && [401, 404].includes(error.statusCode)) peer.close(4003, 'Access expired')
    }
  },
  close(peer) {
    try {
      const { room, member } = authenticate(peer.request)
      roomStore.disconnect(room, member, peer.id)
    } catch { /* Room ended or session revoked. */ }
  },
})
