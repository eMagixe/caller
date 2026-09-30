import type { ServerSignal } from '#shared/types/room.ts'
import { errorMessage } from '~/utils/errors'
import type { CallContext } from './context'

interface Deps {
	send: (message: { type: 'ping' }) => void
	handle: (message: ServerSignal) => Promise<void>
	resetPeer: () => void
	dispose: () => void
}

export function useCallSocket(ctx: CallContext, { send, handle, resetPeer, dispose }: Deps) {
	const { state, socketOnline, error, ended } = ctx

	function connectSocket() {
		if (state.disposed) return

		const path = `/api/rooms/${ctx.roomId}/socket`
		const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
		const urlConnect = `${protocol}//${location.host}${path}`

		const ws = new WebSocket(urlConnect)

		state.ws = ws

		ws.onopen = () => {
			if (state.ws !== ws || state.disposed) return ws.close()
			socketOnline.value = true
			state.reconnectAttempts = 0
			clearInterval(state.heartbeat)
			state.heartbeat = setInterval(() => send({ type: 'ping' }), 25_000)
		}

		ws.onmessage = (event) => {
			state.queue = state.queue
				.then(async () => {
					if (state.ws !== ws || state.disposed) return
					await handle(JSON.parse(event.data) as ServerSignal)
				})
				.catch((err) => {
					if (!state.disposed) error.value = errorMessage(err, 'Не удалось установить соединение.')
				})
		}

		ws.onclose = (event) => {
			if (state.ws !== ws) return
			socketOnline.value = false
			clearInterval(state.heartbeat)
			resetPeer()
			if (state.disposed) return
			if (event.code >= 4000) {
				ended.value =
					event.code === 4001 ? 'Комната открыта в другой вкладке.' : 'Комната закрыта или доступ отозван.'
				dispose()
				return
			}
			if (++state.reconnectAttempts > 5) {
				error.value = 'Соединение с сервером потеряно. Нажмите «Переподключиться».'
				return
			}
			state.reconnectTimer = setTimeout(
				connectSocket,
				Math.min(1000 * 2 ** (state.reconnectAttempts - 1), 10_000)
			)
		}
	}

	function reconnect() {
		if (state.disposed) return
		error.value = ''
		clearTimeout(state.reconnectTimer)
		clearInterval(state.heartbeat)
		if (state.ws) {
			state.ws.onclose = null
			state.ws.close()
		}
		resetPeer()
		socketOnline.value = false
		state.reconnectAttempts = 0
		connectSocket()
	}

	return { connectSocket, reconnect }
}
