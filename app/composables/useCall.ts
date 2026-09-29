import type { ClientSignal, RoomSnapshot, ServerSignal } from '#shared/types/room.ts'
import { errorMessage } from '~/utils/errors'

export interface ChatMessage {
	id: string
	text: string
	mine: boolean
	time: number
}

export function useCall(roomId: string) {
	const room = shallowRef<RoomSnapshot>()
	const localStream = shallowRef<MediaStream>()
	const remoteStream = shallowRef<MediaStream>()
	const audioEnabled = ref(true)
	const videoEnabled = ref(false)
	const remoteAudio = ref(true)
	const remoteVideo = ref(false)
	const connected = ref(false)
	const socketOnline = ref(false)
	const joined = ref(false)
	const connecting = ref(false)
	const error = ref('')
	const ended = ref('')
	const hasTurn = ref(true)
	const chatReady = ref(false)
	const messages = ref<ChatMessage[]>([])
	const connectedAt = ref(0)
	const self = computed(() => room.value?.participants.find((person) => person.id === room.value?.selfId))
	const other = computed(() => room.value?.participants.find((person) => person.id !== room.value?.selfId))
	let socket: WebSocket | undefined
	let pc: RTCPeerConnection | undefined
	let channel: RTCDataChannel | undefined
	let videoSender: RTCRtpSender | undefined
	let candidates: RTCIceCandidateInit[] = []
	let reconnectTimer: ReturnType<typeof setTimeout> | undefined
	let heartbeat: ReturnType<typeof setInterval> | undefined
	let failureTimer: ReturnType<typeof setTimeout> | undefined
	let generation = 0
	let preparing = false
	let disposed = false
	let reconnectAttempts = 0
	let mediaBusy = false
	let queue = Promise.resolve()

	function send(message: ClientSignal) {
		if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
	}
	function sendMedia() {
		send({ type: 'media', audio: audioEnabled.value, video: videoEnabled.value })
	}

	async function getMedia(video: boolean) {
		if (!navigator.mediaDevices?.getUserMedia)
			throw new Error('Для звонка откройте приложение по HTTPS или на localhost в современном браузере.')
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: true, noiseSuppression: true },
			video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
		})
		if (disposed) {
			stream.getTracks().forEach((track) => track.stop())
			return
		}
		localStream.value?.getTracks().forEach((track) => track.stop())
		localStream.value = stream
		audioEnabled.value = true
		videoEnabled.value = video
	}

	function resetPeer() {
		generation++
		preparing = false
		clearTimeout(failureTimer)
		if (pc) {
			pc.onconnectionstatechange = null
			pc.ontrack = null
			pc.onicecandidate = null
			pc.ondatachannel = null
			pc.close()
		}
		pc = undefined
		channel?.close()
		channel = undefined
		videoSender = undefined
		remoteStream.value = undefined
		connected.value = false
		chatReady.value = false
		connectedAt.value = 0
		remoteVideo.value = false
		candidates = []
	}

	function attachChannel(dataChannel: RTCDataChannel) {
		channel = dataChannel
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

	async function preparePeer() {
		if (pc || preparing || disposed || !self.value?.approved || !localStream.value || !socketOnline.value) return
		preparing = true
		const currentGeneration = generation
		try {
			const config = await $fetch<{ iceServers: RTCIceServer[]; hasTurn: boolean }>(`/api/rooms/${roomId}/ice`)
			if (disposed || generation !== currentGeneration) return
			hasTurn.value = config.hasTurn
			const peer = new RTCPeerConnection({ iceServers: config.iceServers })
			pc = peer
			const stream = localStream.value!
			for (const track of stream.getAudioTracks()) peer.addTrack(track, stream)
			const videoTrack = stream.getVideoTracks()[0]
			videoSender = videoTrack
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
				if (pc !== peer) return
				connected.value = peer.connectionState === 'connected'
				if (connected.value) {
					clearTimeout(failureTimer)
					connectedAt.value ||= Date.now()
					error.value = ''
					sendMedia()
				}
				if (['failed', 'disconnected'].includes(peer.connectionState)) {
					clearTimeout(failureTimer)
					failureTimer = setTimeout(
						() => {
							if (pc !== peer || peer.connectionState === 'connected') return
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
			if (generation === currentGeneration) preparing = false
		}
	}

	async function handle(message: ServerSignal) {
		if (disposed) return
		if (message.type === 'state') {
			room.value = message.room
			await preparePeer()
		}
		if (message.type === 'start') {
			clearTimeout(failureTimer)
			failureTimer = setTimeout(() => {
				if (!connected.value && !disposed)
					error.value =
						'Соединение не установлено. Проверьте сеть и настройку TURN, затем повторите подключение.'
			}, 30_000)
			sendMedia()
			if (self.value?.role === 'host' && pc) {
				await pc.setLocalDescription(await pc.createOffer())
				send({ type: 'signal', description: { type: 'offer', sdp: pc.localDescription!.sdp } })
			}
		}
		if (message.type === 'signal' && pc) {
			const peer = pc
			if (message.description) {
				await peer.setRemoteDescription(message.description)
				for (const candidate of candidates) await peer.addIceCandidate(candidate)
				candidates = []
				if (message.description.type === 'offer') {
					await peer.setLocalDescription(await peer.createAnswer())
					send({ type: 'signal', description: { type: 'answer', sdp: peer.localDescription!.sdp } })
				}
			} else if (message.candidate) {
				if (peer.remoteDescription) await peer.addIceCandidate(message.candidate)
				else candidates.push(message.candidate)
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

	function connectSocket() {
		if (disposed) return
		const ws = new WebSocket(
			`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/rooms/${roomId}/socket`
		)
		socket = ws
		ws.onopen = () => {
			if (socket !== ws || disposed) return ws.close()
			socketOnline.value = true
			reconnectAttempts = 0
			clearInterval(heartbeat)
			heartbeat = setInterval(() => send({ type: 'ping' }), 25_000)
		}
		ws.onmessage = (event) => {
			queue = queue
				.then(async () => {
					if (socket !== ws || disposed) return
					await handle(JSON.parse(event.data) as ServerSignal)
				})
				.catch((err) => {
					if (!disposed) error.value = errorMessage(err, 'Не удалось установить соединение.')
				})
		}
		ws.onclose = (event) => {
			if (socket !== ws) return
			socketOnline.value = false
			clearInterval(heartbeat)
			resetPeer()
			if (disposed) return
			if (event.code >= 4000) {
				ended.value =
					event.code === 4001 ? 'Комната открыта в другой вкладке.' : 'Комната закрыта или доступ отозван.'
				dispose()
				return
			}
			if (++reconnectAttempts > 5) {
				error.value = 'Соединение с сервером потеряно. Нажмите «Переподключиться».'
				return
			}
			reconnectTimer = setTimeout(connectSocket, Math.min(1000 * 2 ** (reconnectAttempts - 1), 10_000))
		}
	}

	async function join(name: string, invite: string, video: boolean) {
		if (connecting.value || joined.value) return
		connecting.value = true
		error.value = ''
		try {
			await getMedia(video)
			if (disposed) return
			if (!room.value) {
				room.value = await $fetch<RoomSnapshot>(`/api/rooms/${roomId}/join`, {
					method: 'POST',
					body: { name, invite }
				})
				sessionStorage.removeItem(`guest-invite:${roomId}`)
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

	function toggleAudio() {
		audioEnabled.value = !audioEnabled.value
		localStream.value?.getAudioTracks().forEach((track) => {
			track.enabled = audioEnabled.value
		})
		if (connected.value) sendMedia()
	}

	async function toggleVideo() {
		if (mediaBusy || !localStream.value) return
		mediaBusy = true
		try {
			if (videoEnabled.value) {
				await videoSender?.replaceTrack(null)
				localStream.value.getVideoTracks().forEach((track) => {
					track.stop()
					localStream.value?.removeTrack(track)
				})
				videoEnabled.value = false
			} else {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { width: { ideal: 1280 }, height: { ideal: 720 } }
				})
				if (disposed) {
					stream.getTracks().forEach((track) => track.stop())
					return
				}
				const track = stream.getVideoTracks()[0]!
				try {
					await videoSender?.replaceTrack(track)
				} catch (err) {
					track.stop()
					throw err
				}
				localStream.value.addTrack(track)
				localStream.value = new MediaStream(localStream.value.getTracks())
				videoEnabled.value = true
			}
			if (connected.value) sendMedia()
		} catch (err) {
			error.value = errorMessage(err)
		} finally {
			mediaBusy = false
		}
	}

	function sendChat(text: string) {
		text = text.trim()
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

	async function leave() {
		error.value = ''
		try {
			await $fetch(`/api/rooms/${roomId}/leave`, { method: 'POST', body: {} })
			ended.value ||= 'Спасибо за разговор. До новой встречи!'
			sessionStorage.removeItem(`invite:${roomId}`)
			dispose()
		} catch (err) {
			error.value = errorMessage(err)
		}
	}

	function reconnect() {
		if (disposed) return
		error.value = ''
		clearTimeout(reconnectTimer)
		clearInterval(heartbeat)
		if (socket) {
			socket.onclose = null
			socket.close()
		}
		resetPeer()
		socketOnline.value = false
		reconnectAttempts = 0
		connectSocket()
	}

	function dispose() {
		disposed = true
		generation++
		clearTimeout(reconnectTimer)
		clearInterval(heartbeat)
		if (socket) {
			socket.onclose = null
			socket.close()
		}
		resetPeer()
		localStream.value?.getTracks().forEach((track) => track.stop())
		localStream.value = undefined
		socketOnline.value = false
		messages.value = []
	}

	onBeforeUnmount(dispose)
	return {
		room,
		self,
		other,
		localStream,
		remoteStream,
		audioEnabled,
		videoEnabled,
		remoteAudio,
		remoteVideo,
		connected,
		socketOnline,
		joined,
		connecting,
		error,
		ended,
		hasTurn,
		chatReady,
		messages,
		connectedAt,
		join,
		toggleAudio,
		toggleVideo,
		sendChat,
		send,
		leave,
		reconnect
	}
}
