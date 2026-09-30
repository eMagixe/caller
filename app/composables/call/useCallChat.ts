import type { CallContext } from './context'

export function useCallChat(ctx: CallContext) {
	const { state, chatReady, messages, error } = ctx

	function attachChannel(dataChannel: RTCDataChannel) {
		state.channel = dataChannel
		dataChannel.onopen = () => {
			chatReady.value = true
		}
		dataChannel.onclose = () => {
			chatReady.value = false
		}
		dataChannel.onmessage = (event) => {
			if (typeof event.data !== 'string' || event.data.length > 10_000) return
			try {
				const data = JSON.parse(event.data)
				if (
					data.type !== 'chat' ||
					typeof data.text !== 'string' ||
					!data.text.trim() ||
					data.text.length > 2000 ||
					typeof data.id !== 'string' ||
					data.id.length > 64
				)
					return
				if (messages.value.some((message) => message.id === data.id)) return
				messages.value = [
					...messages.value.slice(-199),
					{ id: data.id, text: data.text, mine: false, time: Date.now() }
				]
			} catch {
				/* Ignore malformed data-channel packets. */
			}
		}
	}

	function sendChat(text: string) {
		text = text.trim()
		const channel = state.channel
		if (!text || text.length > 2000 || channel?.readyState !== 'open') return false
		if (channel.bufferedAmount > 64_000) {
			error.value = 'Сообщения ещё отправляются. Подождите немного.'
			return false
		}
		const message = { type: 'chat', id: crypto.randomUUID(), text }
		try {
			channel.send(JSON.stringify(message))
			messages.value = [...messages.value.slice(-199), { id: message.id, text, mine: true, time: Date.now() }]
			return true
		} catch {
			error.value = 'Не удалось отправить сообщение.'
			return false
		}
	}

	return { attachChannel, sendChat }
}
