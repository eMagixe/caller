import type { CallContext } from './context'

interface Deps {
	resetPeer: () => void
}

/** dispose вынесен отдельно, чтобы разорвать циклическую зависимость socket ↔ signaling ↔ session. */
export function useCallLifecycle(ctx: CallContext, { resetPeer }: Deps) {
	const { state, localStream, socketOnline, messages } = ctx

	function dispose() {
		state.disposed = true
		state.generation++
		clearTimeout(state.reconnectTimer)
		clearInterval(state.heartbeat)
		if (state.ws) {
			state.ws.onclose = null
			state.ws.close()
		}
		resetPeer()
		localStream.value?.getTracks().forEach((track) => track.stop())
		localStream.value = undefined
		socketOnline.value = false
		messages.value = []
	}

	return { dispose }
}
