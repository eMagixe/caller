import type { ClientSignal } from '#shared/types/room.ts'
import type { CallContext } from './context'

interface Deps {
	send: (message: ClientSignal) => void
	sendMedia: () => void
	attachChannel: (channel: RTCDataChannel) => void
}

export function useCallPeer(ctx: CallContext, { send, sendMedia, attachChannel }: Deps) {
	const {
		state,
		self,
		localStream,
		remoteStream,
		socketOnline,
		connected,
		chatReady,
		connectedAt,
		remoteVideo,
		hasTurn,
		error
	} = ctx

	function resetPeer() {
		state.generation++
		state.preparing = false
		clearTimeout(state.failureTimer)
		if (state.pc) {
			state.pc.onconnectionstatechange = null
			state.pc.ontrack = null
			state.pc.onicecandidate = null
			state.pc.ondatachannel = null
			state.pc.close()
		}
		state.pc = undefined
		state.channel?.close()
		state.channel = undefined
		state.videoSender = undefined
		remoteStream.value = undefined
		connected.value = false
		chatReady.value = false
		connectedAt.value = 0
		remoteVideo.value = false
		state.candidates = []
	}

	async function preparePeer() {
		if (
			state.pc ||
			state.preparing ||
			state.disposed ||
			!self.value?.approved ||
			!localStream.value ||
			!socketOnline.value
		)
			return
		state.preparing = true
		const currentGeneration = state.generation
		try {
			const config = await $fetch<{ iceServers: RTCIceServer[]; hasTurn: boolean }>(
				`/api/rooms/${ctx.roomId}/ice`
			)
			if (state.disposed || state.generation !== currentGeneration) return
			hasTurn.value = config.hasTurn
			const peer = new RTCPeerConnection({ iceServers: config.iceServers })
			state.pc = peer
			const stream = localStream.value!
			for (const track of stream.getAudioTracks()) peer.addTrack(track, stream)
			const videoTrack = stream.getVideoTracks()[0]
			state.videoSender = videoTrack
				? peer.addTrack(videoTrack, stream)
				: peer.addTransceiver('video', { direction: 'sendrecv', streams: [stream] }).sender
			peer.onicecandidate = (event) => {
				if (event.candidate) send({ type: 'signal', candidate: event.candidate.toJSON() })
			}
			peer.ontrack = (event) => {
				const remote = remoteStream.value || new MediaStream()
				if (!remote.getTracks().some((track) => track.id === event.track.id)) remote.addTrack(event.track)
				remoteStream.value = remote
			}
			peer.onconnectionstatechange = () => {
				if (state.pc !== peer) return
				connected.value = peer.connectionState === 'connected'
				if (connected.value) {
					clearTimeout(state.failureTimer)
					connectedAt.value ||= Date.now()
					error.value = ''
					sendMedia()
				}
				if (['failed', 'disconnected'].includes(peer.connectionState)) {
					clearTimeout(state.failureTimer)
					state.failureTimer = setTimeout(
						() => {
							if (state.pc !== peer || peer.connectionState === 'connected') return
							error.value =
								'Не удалось соединиться с собеседником. Проверьте сеть и повторите подключение.'
						},
						peer.connectionState === 'failed' ? 0 : 10_000
					)
				}
			}
			peer.ondatachannel = (event) => attachChannel(event.channel)
			if (self.value?.role === 'host') attachChannel(peer.createDataChannel('chat', { ordered: true }))
			send({ type: 'ready' })
		} finally {
			if (state.generation === currentGeneration) state.preparing = false
		}
	}

	return { resetPeer, preparePeer }
}
