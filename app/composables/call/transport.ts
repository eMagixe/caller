import type { ClientSignal } from '#shared/types/room.ts'
import type { CallContext } from './context'

/** Отправка сообщений в сигнальный сокет. Зависит только от контекста. */
export function createSender(ctx: CallContext) {
	const { state, audioEnabled, videoEnabled } = ctx

	function send(message: ClientSignal) {
		if (state.ws?.readyState === WebSocket.OPEN) state.ws.send(JSON.stringify(message))
	}

	function sendMedia() {
		send({ type: 'media', audio: audioEnabled.value, video: videoEnabled.value })
	}

	return { send, sendMedia }
}
