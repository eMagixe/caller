import { roomStore } from '../utils/room-store'

export default defineNitroPlugin((nitroApp) => {
  const interval = setInterval(() => roomStore.sweep(), 30_000)
  interval.unref()
  nitroApp.hooks.hook('close', () => clearInterval(interval))
})
