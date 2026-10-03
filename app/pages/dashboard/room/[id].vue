<script setup lang="ts">
import { useWebSocket } from '@vueuse/core'

const route = useRoute()
const room = route.params.id as string

const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)

// RTCPeerConnection создаём только на клиенте (в onMounted), иначе SSR упадёт
let webRTC: RTCPeerConnection
const candidates: RTCIceCandidateInit[] = []

let stream: MediaStream | undefined

// Сигнал "локальные устройства готовы, треки добавлены в соединение"
let resolveReady!: () => void
const ready = new Promise<void>((resolve) => (resolveReady = resolve))

// Очередь, чтобы сообщения сигналинга обрабатывались строго по порядку
let queue: Promise<void> = Promise.resolve()

const audioStatus = ref(true)
const videoStatus = ref(true)

const url = useRequestURL()
const webSocketProtocol = url.protocol === 'https:' ? 'wss' : 'ws'
const webSocketUrl = `${webSocketProtocol}://${url.host}/api/rooms/create?room=${room}`

const webSocket = useWebSocket(webSocketUrl, {
	onMessage: (_ws, event) => {
		const data = JSON.parse(event.data)
		queue = queue.then(() => handle(data)).catch(console.error)
	}
})

const send = (msg: object) => webSocket.send(JSON.stringify(msg))

function createPeerConnection() {
	const pc = new RTCPeerConnection({
		iceServers: [
			{
				urls: ['turn:turn.magixe-dev.ru:3478', 'stun:turn.magixe-dev.ru:3478'],
				username: 'magixe',
				credential: 'uiogf82'
			}
		],
		iceTransportPolicy: 'relay'
	})

	pc.onicecandidate = (event) => {
		console.log('[rtc] local candidate', event.candidate?.candidate ?? 'end-of-candidates')
		if (event.candidate) send({ type: 'candidate', candidate: event.candidate })
	}

	pc.onicegatheringstatechange = () => console.log('[rtc] gathering:', pc.iceGatheringState)

	pc.ontrack = (event) => {
		console.log('[rtc] ontrack', event.track.kind)
		const el = remoteVideo.value
		if (!el) return
		const remoteStream = event.streams[0] ?? new MediaStream([event.track])
		if (el.srcObject !== remoteStream) el.srcObject = remoteStream
		el.play().catch((e) => console.warn('remote play failed', e))
	}

	pc.onconnectionstatechange = () => {
		console.log('[rtc] connection:', pc.connectionState)
	}
	pc.oniceconnectionstatechange = () => console.log('[rtc] ice:', pc.iceConnectionState)
	pc.onsignalingstatechange = () => console.log('[rtc] signaling:', pc.signalingState)

	return pc
}

async function addCandidate() {
	for (const candidate of candidates) await webRTC.addIceCandidate(candidate)
	candidates.length = 0
}

async function handle(data: any) {
	// ждём, пока локальные треки будут добавлены, иначе offer/answer уйдут без них
	await ready

	if (data.type === 'join') {
		// мы уже в комнате — инициируем соединение
		const offer = await webRTC.createOffer()
		await webRTC.setLocalDescription(offer)
		send({ type: 'offer', sdp: webRTC.localDescription })
	}

	if (data.type === 'offer') {
		await webRTC.setRemoteDescription(data.sdp)
		await addCandidate()
		const answer = await webRTC.createAnswer()
		await webRTC.setLocalDescription(answer)
		send({ type: 'answer', sdp: webRTC.localDescription })
	}

	if (data.type === 'answer') {
		await webRTC.setRemoteDescription(data.sdp)
		await addCandidate()
	}

	if (data.type === 'candidate') {
		console.log('[ws] remote candidate', data.candidate?.candidate)
		if (webRTC.remoteDescription) await webRTC.addIceCandidate(data.candidate)
		else candidates.push(data.candidate)
	}
}

function createEmptyVideoTrack({ width = 640, height = 480, text = 'No camera' } = {}) {
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d')

	const draw = () => {
		if (ctx) {
			ctx.fillStyle = '#222'
			ctx.fillRect(0, 0, width, height)
			ctx.fillStyle = '#888'
			ctx.font = '32px sans-serif'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText(text, width / 2, height / 2)
		}
	}

	draw()

	const timer = setInterval(draw, 1000)

	const track = canvas.captureStream(5).getVideoTracks()[0]

	if (track) {
		track.addEventListener('ended', () => clearInterval(timer))
		const originalStop = track.stop.bind(track)
		track.stop = () => {
			clearInterval(timer)
			originalStop()
		}
	}

	return track
}

function createEmptyAudioTrack() {
	const ctx = new AudioContext()
	const dst = ctx.createMediaStreamDestination()
	const osc = ctx.createOscillator()
	const gain = ctx.createGain()
	gain.gain.value = 0
	osc.connect(gain).connect(dst)
	osc.start()

	const track = dst.stream.getAudioTracks()[0]
	if (track) {
		const originalStop = track.stop.bind(track)
		track.stop = () => {
			originalStop()
			ctx.close()
		}
	}
	return track
}

async function initLocalDevices(): Promise<MediaStream> {
	const devices = await navigator.mediaDevices.enumerateDevices()
	const hasVideo = devices.some((device) => device.kind === 'videoinput')
	const hasAudio = devices.some((device) => device.kind === 'audioinput')

	const wantVideo = videoStatus.value
	const wantAudio = audioStatus.value

	let result: MediaStream
	try {
		result = await navigator.mediaDevices.getUserMedia({
			video: wantVideo && hasVideo,
			audio: wantAudio && hasAudio
		})
	} catch (error) {
		console.warn('getUserMedia failed:', error)
		result = new MediaStream()
	}

	if (wantVideo && result.getVideoTracks().length === 0) {
		const track = createEmptyVideoTrack()
		track && result.addTrack(track)
	}

	if (wantAudio && result.getAudioTracks().length === 0) {
		const track = createEmptyAudioTrack()
		track && result.addTrack(track)
	}

	return result
}

function toggleAudio() {
	audioStatus.value = !audioStatus.value
	stream?.getAudioTracks().forEach((track) => {
		track.enabled = audioStatus.value
	})
}

function toggleVideo() {
	videoStatus.value = !videoStatus.value
	stream?.getVideoTracks().forEach((track) => {
		track.enabled = videoStatus.value
	})
}

function cleanup() {
	stream?.getTracks().forEach((track) => track.stop())
	webRTC?.close()
	webSocket.close()
}

function leave() {
	cleanup()
	navigateTo('/dashboard')
}

onMounted(async () => {
	webRTC = createPeerConnection()

	try {
		stream = await initLocalDevices()

		if (localVideo.value) {
			localVideo.value.srcObject = stream
			stream.getTracks().forEach((track) => webRTC.addTrack(track, stream!))
		}
	} catch (error) {
		console.error(error)
	} finally {
		resolveReady()
	}

	send({ type: 'join' })
})

onBeforeUnmount(() => {
	cleanup()
})
</script>

<template>
	<div class="w-full h-full max-h-[calc(100vh-96px)] relative">
		<video
			ref="localVideo"
			autoplay
			playsinline
			muted
			class="absolute shadow-2xl border border-b-gray-800 right-5 bottom-5 w-100 h-50 not-sm:right-2.5 not-sm:bottom-2.5 not-sm:w-25 not-sm:h-50 z-50 bg-gray-900 rounded-2xl"
		/>

		<div
			class="absolute flex flex-row gap-3 right-[calc(25%)] w-1/2 justify-center items-center bg-white p-3 rounded-xl z-50 top-5 not-sm:top-2.5"
		>
			<UButton
				icon="i-lucide-video-off"
				@click="toggleVideo"
				class="hover:bg-red-400"
				:class="videoStatus ? 'bg-white' : 'bg-red-400'"
				:ui="{
					leadingIcon: videoStatus ? 'hover:text-white text-primary' : 'text-white'
				}"
			/>
			<UButton
				icon="i-lucide-mic-off"
				@click="toggleAudio"
				class="hover:bg-red-400"
				:class="audioStatus ? 'bg-white' : 'bg-red-400'"
				:ui="{
					leadingIcon: audioStatus ? 'hover:text-white text-primary' : 'text-white'
				}"
			/>
			<UButton
				icon="i-lucide-phone-off"
				@click="leave"
				class="bg-red-400 hover:bg-red-500"
				:ui="{
					leadingIcon: 'text-white'
				}"
			/>
		</div>

		<video ref="remoteVideo" autoplay playsinline class="absolute w-full h-full rounded-2xl bg-gray-900" />
	</div>
</template>
