import type { RoomSnapshot } from '#shared/types/room.ts'
import { errorMessage } from '~/utils/errors'
import type { CallContext } from './context'

interface Deps {
	getMedia: (video: boolean) => Promise<void>
	connectSocket: () => void
	dispose: () => void
}

export function useCallSession(ctx: CallContext, { getMedia, connectSocket, dispose }: Deps) {
	const { state, room, localStream, joined, connecting, error, ended } = ctx

	async function join(name: string, invite: string, video: boolean) {
		if (connecting.value || joined.value) return
		connecting.value = true
		error.value = ''
		try {
			await getMedia(video)
			if (state.disposed) return
			if (!room.value) {
				room.value = await $fetch<RoomSnapshot>(`/api/rooms/${ctx.roomId}/join`, {
					method: 'POST',
					body: { name, invite }
				})
				sessionStorage.removeItem(`guest-invite:${ctx.roomId}`)
			}
			joined.value = true
			connectSocket()
		} catch (err) {
			localStream.value?.getTracks().forEach((track) => track.stop())
			localStream.value = undefined
			error.value = errorMessage(err)
		} finally {
			connecting.value = false
		}
	}

	async function leave() {
		error.value = ''
		try {
			await $fetch(`/api/rooms/${ctx.roomId}/leave`, { method: 'POST', body: {} })
			ended.value ||= 'Спасибо за разговор. До новой встречи!'
			sessionStorage.removeItem(`invite:${ctx.roomId}`)
			dispose()
		} catch (err) {
			error.value = errorMessage(err)
		}
	}

	return { join, leave }
}
