<script setup lang="ts">
import { useWebSocket } from '@vueuse/core'

const route = useRoute()
const room = route.params.id as string

const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)

const webRTC = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] })
const candidates: RTCIceCandidateInit[] = []
const localDevicesInitPromise = ref<Promise<void>>()

const webSocket = useWebSocket(`wss://${location.host}/api/rooms/create?room=${room}`, {
	onMessage: (webSocket, event) => handle(JSON.parse(event.data))
})

const send = (msg: object) => webSocket.send(JSON.stringify(msg))

webRTC.onicecandidate = (event) => {
	if (event.candidate) send({ type: 'candidate', candidate: event.candidate })
}

webRTC.ontrack = (event) => {
	if (event.streams[0]) remoteVideo.value!.srcObject = event.streams[0]
}

async function addCandidate() {
	for (const candidate of candidates) await webRTC.addIceCandidate(candidate)
	candidates.length = 0
}

async function handle(data: any) {
	await localDevicesInitPromise.value

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
		if (webRTC.remoteDescription) await webRTC.addIceCandidate(data.candidate)
		else candidates.push(data.candidate)
	}
}

async function initLocalDevices() {
	const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
	localVideo.value!.srcObject = stream
	stream.getTracks().forEach((t) => webRTC.addTrack(t, stream))
}

onMounted(async () => {
	localDevicesInitPromise.value = initLocalDevices().then(() => {
		send({ type: 'join' })
	})
})
</script>

<template>
	<div class="w-full h-full relative">
		<video
			ref="remoteVideo"
			autoplay
			playsinline
			class="absolute shadow-2xl border border-b-gray-800 right-5 bottom-5 w-100 h-50 not-sm:right-2.5 not-sm:bottom-2.5 not-sm:w-25 not-sm:h-50 z-50 bg-gray-900 rounded-2xl"
		/>
		<video ref="localVideo" autoplay playsinline muted class="absolute w-full h-full rounded-2xl bg-gray-900" />
	</div>
</template>
