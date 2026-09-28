import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RoomError, RoomStore, type Connection } from '../server/utils/room-store'

function connection(id: string) {
  const messages: any[] = []
  const closes: unknown[] = []
  const peer: Connection = { id, send: (message) => messages.push(message), close: (...args) => closes.push(args) }
  return { peer, messages, closes }
}

test('room credentials are unpredictable, private and scoped to one room', () => {
  const store = new RoomStore()
  const first = store.create('Аня', 'Встреча', 'video')
  const second = store.create('Борис', 'Другая встреча', 'audio')
  assert.notEqual(first.room.id, second.room.id)
  assert.ok(first.invite.length >= 43)
  assert.notEqual(first.room.inviteHash, first.invite)
  assert.notEqual(first.member.sessionHash, first.session)
  assert.throws(() => store.authenticate(first.room.id), { statusCode: 401 })
  assert.throws(() => store.authenticate(first.room.id, second.session), { statusCode: 401 })
  assert.equal(store.authenticate(first.room.id, first.session).member.role, 'host')
  const snapshot = JSON.stringify(store.snapshot(first.room, first.member))
  assert.ok(!snapshot.includes('sessionHash'))
  assert.ok(!snapshot.includes('inviteHash'))
})

test('invitations are single-use and do not admit a third participant', () => {
  const store = new RoomStore()
  const host = store.create('Аня', 'Встреча', 'video')
  assert.throws(() => store.join(host.room.id, 'wrong', 'Атакующий'), { statusCode: 403 })
  const guest = store.join(host.room.id, host.invite, 'Борис')
  assert.equal(guest.member.approved, false)
  assert.throws(() => store.join(host.room.id, host.invite, 'Третий'), { statusCode: 403 })
  assert.throws(() => store.invite(host.room, host.member), { statusCode: 409 })
  assert.equal(host.room.members.size, 2)
})

test('a guest cannot signal, access host actions, or start media before approval', () => {
  const store = new RoomStore()
  const host = store.create('Аня', 'Встреча', 'video')
  const guest = store.join(host.room.id, host.invite, 'Борис')
  const hostConnection = connection('host')
  const guestConnection = connection('guest')
  store.connect(host.room, host.member, hostConnection.peer)
  store.connect(host.room, guest.member, guestConnection.peer)
  store.ready(host.room, host.member)
  assert.throws(() => store.ready(host.room, guest.member), { statusCode: 403 })
  assert.throws(() => store.relay(host.room, guest.member, { type: 'media', audio: true, video: true }), { statusCode: 403 })
  assert.throws(() => store.approve(host.room, guest.member, guest.member.id), { statusCode: 403 })
  assert.throws(() => store.reject(host.room, guest.member, host.member.id), { statusCode: 403 })
  assert.throws(() => store.invite(host.room, guest.member), { statusCode: 403 })
  assert.equal(host.room.started, false)
  store.approve(host.room, host.member, guest.member.id)
  assert.equal(host.room.started, false)
  store.ready(host.room, guest.member)
  assert.equal(host.room.started, true)
  assert.equal(hostConnection.messages.filter(message => message.type === 'start').length, 1)
  store.ready(host.room, guest.member)
  assert.equal(hostConnection.messages.filter(message => message.type === 'start').length, 1)
  store.relay(host.room, guest.member, { type: 'media', audio: true, video: false })
  assert.deepEqual(hostConnection.messages.at(-1), { type: 'media', audio: true, video: false })
})

test('rotation and expiration invalidate an invitation', () => {
  const store = new RoomStore()
  const host = store.create('Аня', 'Встреча', 'audio')
  const replacement = store.invite(host.room, host.member)
  assert.throws(() => store.join(host.room.id, host.invite, 'Борис'), { statusCode: 403 })
  host.room.inviteExpiresAt = Date.now() - 1
  assert.throws(() => store.join(host.room.id, replacement, 'Борис'), { statusCode: 403 })
})

test('rejection revokes sessions and allows a fresh invitation', () => {
  const store = new RoomStore()
  const host = store.create('Аня', 'Встреча', 'video')
  const guest = store.join(host.room.id, host.invite, 'Борис')
  const guestConnection = connection('guest')
  store.connect(host.room, guest.member, guestConnection.peer)
  store.reject(host.room, host.member, guest.member.id)
  assert.equal(guestConnection.closes.length, 1)
  assert.throws(() => store.authenticate(host.room.id, guest.session), { statusCode: 401 })
  const invite = store.invite(host.room, host.member)
  assert.equal(store.join(host.room.id, invite, 'Катя').member.name, 'Катя')
})

test('replacing a browser connection cannot be undone by its stale close callback', () => {
  const store = new RoomStore()
  const host = store.create('Аня', 'Встреча', 'video')
  const first = connection('first')
  const second = connection('second')
  store.connect(host.room, host.member, first.peer)
  store.connect(host.room, host.member, second.peer)
  store.disconnect(host.room, host.member, first.peer.id)
  assert.equal(first.closes.length, 1)
  assert.equal(host.member.online, true)
  assert.equal(host.member.connection?.id, 'second')
  store.disconnect(host.room, host.member, second.peer.id)
  assert.equal(host.member.online, false)
})

test('leaving revokes the guest, and ending destroys all room access', () => {
  const store = new RoomStore()
  const host = store.create('Аня', 'Встреча', 'video')
  const guest = store.join(host.room.id, host.invite, 'Борис')
  store.leave(host.room, guest.member)
  assert.throws(() => store.authenticate(host.room.id, guest.session), { statusCode: 401 })
  store.leave(host.room, host.member)
  assert.throws(() => store.authenticate(host.room.id, host.session), { statusCode: 404 })
  assert.throws(() => store.join(host.room.id, host.invite, 'Ещё гость'), { statusCode: 404 })
})

test('expired rooms close their live connections and are removed', () => {
  const store = new RoomStore()
  const host = store.create('Аня', 'Встреча', 'audio')
  const live = connection('host')
  store.connect(host.room, host.member, live.peer)
  host.room.expiresAt = Date.now() - 1
  store.sweep()
  assert.equal(live.closes.length, 1)
  assert.equal(live.messages.at(-1).type, 'ended')
  assert.throws(() => store.get(host.room.id), RoomError)
})
