const rooms = new Map()

function getRoomName(peer: any) {
	const url = new URL(peer.request.url)
	return 'room-' + url.searchParams.get('room')
}

export default defineWebSocketHandler({
	open(peer) {
		console.log('connected: peer: ', peer.id)

		const roomName = getRoomName(peer)
		if (roomName) {
			if (rooms.has(roomName)) {
				const peers = rooms.get(roomName)
				peer.subscribe(roomName)
				peers.add(peer)

				console.log(peer.id + ' joined room ' + roomName)
			} else {
				const peers = new Set()
				console.log('created room ' + roomName)
				peer.subscribe(roomName)

				peers.add(peer)
				rooms.set(roomName, peers)

				console.log(peer.id + ' joined room ' + roomName)
			}
		}
	},

	close(peer) {
		const roomName = getRoomName(peer)

		if (roomName) {
			const peers = rooms.get(roomName)
			peers.delete(peer)
			if (peers.size === 0) {
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
			console.log('peer: ' + peer.id)
			console.log('message: ' + message.id)
			peer.publish(roomName, message.text())
		}
	}
})
