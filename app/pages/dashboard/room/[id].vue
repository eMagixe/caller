<script setup lang="ts">
import { useWebSocket } from '@vueuse/core'

const route = useRoute()
const room = route.params.id as string

const status = ref('Подключаемся…')
const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)

const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] })
const pending: RTCIceCandidateInit[] = []
let ready: Promise<void>

const ws = useWebSocket(`wss://${location.host}/api/rooms/${room}`, {
	onMessage: (_, event) => handle(JSON.parse(event.data))
})
const send = (msg: object) => ws.send(JSON.stringify(msg))

pc.onicecandidate = (e) => {
	if (e.candidate) send({ type: 'candidate', candidate: e.candidate })
}
pc.ontrack = (e) => {
	if (e.streams[0]) remoteVideo.value!.srcObject = e.streams[0]
}

async function flushPending() {
	for (const c of pending) await pc.addIceCandidate(c)
	pending.length = 0
}

async function handle(data: any) {
	await ready // ждём, пока добавятся локальные треки

	if (data.type === 'join') {
		// мы уже в комнате — инициируем соединение
		const offer = await pc.createOffer()
		await pc.setLocalDescription(offer)
		send({ type: 'offer', sdp: pc.localDescription })
	}

	if (data.type === 'offer') {
		await pc.setRemoteDescription(data.sdp)
		await flushPending()
		const answer = await pc.createAnswer()
		await pc.setLocalDescription(answer)
		send({ type: 'answer', sdp: pc.localDescription })
	}

	if (data.type === 'answer') {
		await pc.setRemoteDescription(data.sdp)
		await flushPending()
	}

	if (data.type === 'candidate') {
		if (pc.remoteDescription) await pc.addIceCandidate(data.candidate)
		else pending.push(data.candidate)
	}
}

onMounted(() => {
	ready = (async () => {
		const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
		localVideo.value!.srcObject = stream
		stream.getTracks().forEach((t) => pc.addTrack(t, stream))
	})()
	ready.then(() => {
		send({ type: 'join' })
		status.value = 'Ждём собеседника…'
	})
})
</script>

<template>
	<div class="page">
		<span>{{ status }}</span>

		<div class="row">
			<video ref="localVideo" autoplay playsinline muted />
			<video ref="remoteVideo" autoplay playsinline />
		</div>
	</div>
</template>

<style>
.page {
	font-family: system-ui, sans-serif;
	margin: 1rem;
}
.row {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	margin-top: 1rem;
}
video {
	width: 320px;
	max-width: 100%;
	background: #222;
	border-radius: 6px;
}
</style>
