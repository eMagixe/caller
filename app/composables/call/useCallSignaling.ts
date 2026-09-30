import type { ClientSignal, ServerSignal } from '#shared/types/room.ts'
import type { CallContext } from './context'

interface Deps {
	send: (message: ClientSignal) => void
	sendMedia: () => void
	preparePeer: () => Promise<void>
	resetPeer: () => void
	dispose: () => void
}

export function useCallSignaling(ctx: CallContext, { send, sendMedia, preparePeer, resetPeer, dispose }: Deps) {
	const { state, room, self, connected, error, ended, remoteAudio, remoteVideo } = ctx

	async function handle(message: ServerSignal) {
		if (state.disposed) return
		if (message.type === 'state') {
			room.value = message.room
			await preparePeer()
		}
		if (message.type === 'start') {
			clearTimeout(state.failureTimer)
			state.failureTimer = setTimeout(() => {
				if (!connected.value && !state.disposed)
					error.value =
						'Соединение не установлено. Проверьте сеть и настройку TURN, затем повторите подключение.'
			}, 30_000)
			sendMedia()
			const peer = state.pc
			if (self.value?.role === 'host' && peer) {
				await peer.setLocalDescription(await peer.createOffer())
				send({ type: 'signal', description: { type: 'offer', sdp: peer.localDescription!.sdp } })
			}
		}
		if (message.type === 'signal' && state.pc) {
			const peer = state.pc
			if (message.description) {
				await peer.setRemoteDescription(message.description)
				for (const candidate of state.candidates) await peer.addIceCandidate(candidate)
				state.candidates = []
				if (message.description.type === 'offer') {
					await peer.setLocalDescription(await peer.createAnswer())
					send({ type: 'signal', description: { type: 'answer', sdp: peer.localDescription!.sdp } })
				}
			} else if (message.candidate) {
				if (peer.remoteDescription) await peer.addIceCandidate(message.candidate)
				else state.candidates.push(message.candidate)
			}
		}
		if (message.type === 'peer-left') {
			resetPeer()
			await preparePeer()
		}
		if (message.type === 'media') {
			remoteAudio.value = message.audio
			remoteVideo.value = message.video
		}
		if (message.type === 'error') error.value = message.message
		if (message.type === 'ended') {
			ended.value = message.reason
			dispose()
		}
	}

	return { handle }
}
