import { createCallContext } from './call/context'
import { createSender } from './call/transport'
import { useCallChat } from './call/useCallChat'
import { useCallLifecycle } from './call/useCallLifecycle'
import { useCallMedia } from './call/useCallMedia'
import { useCallPeer } from './call/useCallPeer'
import { useCallSession } from './call/useCallSession'
import { useCallSignaling } from './call/useCallSignaling'
import { useCallSocket } from './call/useCallSocket'

export type { ChatMessage } from './call/types'

export function useCall(roomId: string) {
	const ctx = createCallContext(roomId)

	// Порядок сборки: от «листьев» к «корню», циклов нет.
	const { send, sendMedia } = createSender(ctx)
	const media = useCallMedia(ctx, { sendMedia })
	const chat = useCallChat(ctx)
	const peer = useCallPeer(ctx, { send, sendMedia, attachChannel: chat.attachChannel })
	const { dispose } = useCallLifecycle(ctx, { resetPeer: peer.resetPeer })
	const signaling = useCallSignaling(ctx, {
		send,
		sendMedia,
		preparePeer: peer.preparePeer,
		resetPeer: peer.resetPeer,
		dispose
	})
	const socket = useCallSocket(ctx, { send, handle: signaling.handle, resetPeer: peer.resetPeer, dispose })
	const session = useCallSession(ctx, { getMedia: media.getMedia, connectSocket: socket.connectSocket, dispose })

	// Должно вызываться синхронно в setup-контексте компонента.
	onBeforeUnmount(dispose)

	return {
		room: ctx.room,
		self: ctx.self,
		other: ctx.other,
		localStream: ctx.localStream,
		remoteStream: ctx.remoteStream,
		audioEnabled: ctx.audioEnabled,
		videoEnabled: ctx.videoEnabled,
		remoteAudio: ctx.remoteAudio,
		remoteVideo: ctx.remoteVideo,
		connected: ctx.connected,
		socketOnline: ctx.socketOnline,
		joined: ctx.joined,
		connecting: ctx.connecting,
		error: ctx.error,
		ended: ctx.ended,
		hasTurn: ctx.hasTurn,
		chatReady: ctx.chatReady,
		messages: ctx.messages,
		connectedAt: ctx.connectedAt,
		join: session.join,
		toggleAudio: media.toggleAudio,
		toggleVideo: media.toggleVideo,
		sendChat: chat.sendChat,
		send,
		leave: session.leave,
		reconnect: socket.reconnect
	}
}
