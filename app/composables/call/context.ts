import type { RoomSnapshot } from '#shared/types/room.ts'
import type { ChatMessage } from './types'

/**
 * Общий контекст звонка.
 * - реактивное состояние: ref / shallowRef / computed (можно безопасно деструктурировать)
 * - изменяемое внутреннее состояние: `state` (ВСЕГДА читать через ctx.state.xxx, не деструктурировать)
 */
export function createCallContext(roomId: string) {
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

	const state = {
		ws: undefined as WebSocket | undefined,
		pc: undefined as RTCPeerConnection | undefined,
		channel: undefined as RTCDataChannel | undefined,
		videoSender: undefined as RTCRtpSender | undefined,
		candidates: [] as RTCIceCandidateInit[],
		reconnectTimer: undefined as ReturnType<typeof setTimeout> | undefined,
		heartbeat: undefined as ReturnType<typeof setInterval> | undefined,
		failureTimer: undefined as ReturnType<typeof setTimeout> | undefined,
		generation: 0,
		preparing: false,
		disposed: false,
		reconnectAttempts: 0,
		mediaBusy: false,
		queue: Promise.resolve()
	}

	return {
		roomId,
		room,
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
		self,
		other,
		state
	}
}

export type CallContext = ReturnType<typeof createCallContext>
