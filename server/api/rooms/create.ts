const rooms = new Map()

function getRoomName(peer: any) {
	const url = new URL(peer.request.url)
	return url.searchParams.get('room')
}

export default defineWebSocketHandler({
	open(peer) {
		const roomName = getRoomName(peer)
		if (roomName) {
			if (rooms.has(roomName)) {
				const room = rooms.get(roomName)
				peer.subscribe(roomName)
				room.add(peer)
			} else {
				const peers = new Set()
				peer.subscribe(roomName)
				peers.add(peer)
				rooms.set(roomName, peers)
			}

			console.log('connected: peer: ', peer.id)
		}
	},

	close(peer) {
		const roomName = getRoomName(peer)

		if (roomName) {
			const room = rooms.get(roomName)
			room.delete(peer)
			if (room.size === 0) {
				rooms.delete(roomName)
			}
		}

		console.log('disconnected: peer: ', peer.id)
	},

	error(peer, error) {
		console.error('Error: ', error, ' peer: ', peer.id)
	},

	message(peer, message) {
		const roomName = getRoomName(peer)
		if (roomName) {
			peer.publish(roomName, message.text())
		}
	}
})
