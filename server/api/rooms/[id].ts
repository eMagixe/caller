const room = 'ROOM'

export default defineWebSocketHandler({
	open(peer) {
		console.log('connected: peer: ', peer.id)
		peer.subscribe(room)
	},
	close(peer) {
		console.log('disconnected: peer: ', peer.id)
	},
	error(peer, error) {
		console.error('Error: ', error, ' peer: ', peer.id)
	},
	message(peer, message) {
		peer.publish(room, message.text())
	}
})
