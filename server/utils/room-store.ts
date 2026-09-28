import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { CallMode, Participant, RoomSnapshot, ServerSignal } from '../../shared/types/room'

export const ROOM_TTL = 12 * 60 * 60 * 1000
const INVITE_TTL = 30 * 60 * 1000
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const secret = () => randomBytes(32).toString('base64url')

export class RoomError extends Error {
  constructor(public statusCode: number, message: string) { super(message) }
}
export interface Connection {
  id: string
  send: (message: unknown) => unknown
  close: (code?: number, reason?: string) => unknown
}
export interface Member extends Participant {
  sessionHash: string
  ready: boolean
  connection?: Connection
}
export interface Room {
  id: string
  title: string
  mode: CallMode
  expiresAt: number
  inviteHash?: string
  inviteExpiresAt: number
  members: Map<string, Member>
  started: boolean
}

// One Node process owns all rooms. A shared store + signaling bus is needed for replicas.
export class RoomStore {
  private rooms = new Map<string, Room>()

  create(name: string, title: string, mode: CallMode) {
    this.sweep()
    if (this.rooms.size >= 500) throw new RoomError(503, 'Сервис занят. Попробуйте позже.')
    const session = secret()
    const invite = secret()
    const host: Member = { id: randomUUID(), name, role: 'host', approved: true, online: false, ready: false, sessionHash: digest(session) }
    const room: Room = {
      id: randomUUID(), title, mode, expiresAt: Date.now() + ROOM_TTL,
      inviteHash: digest(invite), inviteExpiresAt: Date.now() + INVITE_TTL,
      members: new Map([[host.id, host]]), started: false,
    }
    this.rooms.set(room.id, room)
    return { room, member: host, session, invite }
  }

  get(id: string) {
    const room = this.rooms.get(id)
    if (!room || room.expiresAt <= Date.now()) {
      if (room) this.end(room, 'Время действия комнаты истекло.')
      throw new RoomError(404, 'Комната не найдена или уже закрыта.')
    }
    return room
  }

  authenticate(id: string, session?: string) {
    const room = this.get(id)
    const hash = session && digest(session)
    const member = [...room.members.values()].find(item => item.sessionHash === hash)
    if (!member) throw new RoomError(401, 'Для входа нужно приглашение.')
    return { room, member }
  }

  join(id: string, invite: string, name: string) {
    const room = this.get(id)
    if (!room.inviteHash || room.inviteExpiresAt <= Date.now() || digest(invite) !== room.inviteHash) {
      throw new RoomError(403, 'Приглашение недействительно, использовано или просрочено.')
    }
    if (room.members.size >= 2) throw new RoomError(409, 'В комнате уже есть собеседник.')
    const session = secret()
    const member: Member = { id: randomUUID(), name, role: 'guest', approved: false, online: false, ready: false, sessionHash: digest(session) }
    room.inviteHash = undefined // Atomic single-use redemption, before any asynchronous work.
    room.members.set(member.id, member)
    this.broadcast(room)
    return { room, member, session }
  }

  invite(room: Room, member: Member) {
    this.host(member)
    if (room.members.size >= 2) throw new RoomError(409, 'Сначала дождитесь выхода гостя или отклоните его запрос.')
    const invite = secret()
    room.inviteHash = digest(invite)
    room.inviteExpiresAt = Date.now() + INVITE_TTL
    return invite
  }

  snapshot(room: Room, member: Member): RoomSnapshot {
    return {
      id: room.id, title: room.title, mode: room.mode, expiresAt: room.expiresAt, selfId: member.id,
      participants: [...room.members.values()].map(({ id, name, role, approved, online }) => ({ id, name, role, approved, online })),
    }
  }

  connect(room: Room, member: Member, connection: Connection) {
    const previous = member.connection
    member.connection = connection
    member.online = true
    member.ready = false
    room.started = false
    if (previous && previous.id !== connection.id) previous.close(4001, 'Opened in another tab')
    this.other(room, member)?.connection?.send({ type: 'peer-left' })
    this.broadcast(room)
  }

  disconnect(room: Room, member: Member, connectionId: string) {
    if (member.connection?.id !== connectionId) return
    member.connection = undefined
    member.online = false
    member.ready = false
    room.started = false
    this.other(room, member)?.connection?.send({ type: 'peer-left' })
    this.broadcast(room)
  }

  approve(room: Room, host: Member, id: string) {
    this.host(host)
    const guest = room.members.get(id)
    if (!guest || guest.role !== 'guest') throw new RoomError(400, 'Гость не найден.')
    guest.approved = true
    this.broadcast(room)
    this.maybeStart(room)
  }

  reject(room: Room, host: Member, id: string) {
    this.host(host)
    const guest = room.members.get(id)
    if (!guest || guest.role !== 'guest') throw new RoomError(400, 'Гость не найден.')
    this.removeGuest(room, guest, 'Организатор отклонил запрос на вход.')
  }

  ready(room: Room, member: Member) {
    if (!member.approved) throw new RoomError(403, 'Дождитесь подтверждения организатора.')
    member.ready = true
    this.maybeStart(room)
  }

  relay(room: Room, member: Member, message: ServerSignal) {
    const other = this.other(room, member)
    if (!member.approved || !other?.approved || !room.started) throw new RoomError(403, 'Соединение ещё не разрешено.')
    other.connection?.send(message)
  }

  leave(room: Room, member: Member) {
    if (member.role === 'host') this.end(room, 'Организатор завершил звонок.')
    else this.removeGuest(room, member, 'Вы вышли из комнаты.')
  }

  end(room: Room, reason: string) {
    this.rooms.delete(room.id)
    for (const member of room.members.values()) {
      member.connection?.send({ type: 'ended', reason })
      member.connection?.close(4000, 'Room ended')
    }
    room.members.clear()
    room.inviteHash = undefined
  }

  sweep() {
    for (const room of this.rooms.values()) if (room.expiresAt <= Date.now()) this.end(room, 'Время действия комнаты истекло.')
  }

  private removeGuest(room: Room, guest: Member, reason: string) {
    room.members.delete(guest.id)
    room.started = false
    guest.connection?.send({ type: 'ended', reason })
    guest.connection?.close(4000, 'Access revoked')
    this.other(room, guest)?.connection?.send({ type: 'peer-left' })
    this.broadcast(room)
  }
  private host(member: Member) {
    if (member.role !== 'host') throw new RoomError(403, 'Доступно только организатору.')
  }
  private other(room: Room, member: Member) { return [...room.members.values()].find(item => item.id !== member.id) }
  private broadcast(room: Room) {
    for (const member of room.members.values()) member.connection?.send({ type: 'state', room: this.snapshot(room, member) })
  }
  private maybeStart(room: Room) {
    const members = [...room.members.values()]
    if (!room.started && members.length === 2 && members.every(member => member.approved && member.online && member.ready)) {
      room.started = true
      for (const member of members) member.connection?.send({ type: 'start' })
    }
  }
}

export const roomStore = new RoomStore()
