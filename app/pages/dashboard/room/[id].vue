<script setup lang="ts">
import { useWebSocket } from '@vueuse/core'

const route = useRoute()
const room = ref(route.params.id as string)

const status = ref('')
const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)
let localStream: MediaStream = new MediaStream()

const webSocket = useWebSocket(`ws://${location.host}/api/rooms/${room.value}`)
const webRTC = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] })

async function join() {
	localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
	localStream.getTracks().forEach((track) => webRTC.addTrack(track, localStream))
	localVideo.value!.srcObject = localStream

	webRTC.onicecandidate = (event) => {
		if (event.candidate) {
			const candidateData = JSON.stringify({ type: 'candidate', candidate: event.candidate })
			webSocket.send(candidateData)
		}
	}

	webRTC.ontrack = (event) => {
		const [firstStream] = event.streams
		if (firstStream) remoteVideo.value!.srcObject = firstStream
	}

	const offer = await webRTC.createOffer()
	const offerData = JSON.stringify({ type: 'offer', sdp: offer })

	webSocket.send(offerData)

	status.value = 'Ждём собеседника…'
}

join()

const pending: RTCIceCandidateInit[] = []

watch(webSocket.data, async (newData) => {
	const data = JSON.parse(newData)

	if (data.type === 'offer') {
		await webRTC.setRemoteDescription(data.sdp)

		// Теперь можно добавить накопленные кандидаты
		for (const c of pending) await webRTC.addIceCandidate(c)
		pending.length = 0

		const answer = await webRTC.createAnswer()
		await webRTC.setLocalDescription(answer)
		webSocket.send(JSON.stringify({ type: 'answer', sdp: answer }))
	}

	if (data.type === 'candidate') {
		if (webRTC.remoteDescription) {
			await webRTC.addIceCandidate(data.candidate)
		} else {
			pending.push(data.candidate)
		}
	}
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
