import { errorMessage } from '~/utils/errors'
import type { CallContext } from './context'

interface Deps {
	sendMedia: () => void
}

export function useCallMedia(ctx: CallContext, { sendMedia }: Deps) {
	const { state, localStream, audioEnabled, videoEnabled, connected, error } = ctx

	async function getMedia(video: boolean) {
		if (!navigator.mediaDevices?.getUserMedia)
			throw new Error('Для звонка откройте приложение по HTTPS или на localhost в современном браузере.')
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: true, noiseSuppression: true },
			video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
		})
		if (state.disposed) {
			stream.getTracks().forEach((track) => track.stop())
			return
		}
		localStream.value?.getTracks().forEach((track) => track.stop())
		localStream.value = stream
		audioEnabled.value = true
		videoEnabled.value = video
	}

	function toggleAudio() {
		audioEnabled.value = !audioEnabled.value
		localStream.value?.getAudioTracks().forEach((track) => {
			track.enabled = audioEnabled.value
		})
		if (connected.value) sendMedia()
	}

	async function toggleVideo() {
		if (state.mediaBusy || !localStream.value) return
		state.mediaBusy = true
		try {
			if (videoEnabled.value) {
				await state.videoSender?.replaceTrack(null)
				localStream.value.getVideoTracks().forEach((track) => {
					track.stop()
					localStream.value?.removeTrack(track)
				})
				videoEnabled.value = false
			} else {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { width: { ideal: 1280 }, height: { ideal: 720 } }
				})
				if (state.disposed) {
					stream.getTracks().forEach((track) => track.stop())
					return
				}
				const track = stream.getVideoTracks()[0]!
				try {
					await state.videoSender?.replaceTrack(track)
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
			state.mediaBusy = false
		}
	}

	return { getMedia, toggleAudio, toggleVideo }
}
