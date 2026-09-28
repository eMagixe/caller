import { test, expect, type Page } from '@playwright/test'

const origin = 'http://localhost:3000'
const permissions = ['camera', 'microphone', 'clipboard-read', 'clipboard-write']

async function watchPeers(page: Page) {
  await page.addInitScript(() => {
    const original = window.RTCPeerConnection
    const state = window as typeof window & { testPeers: RTCPeerConnection[] }
    state.testPeers = []
    window.RTCPeerConnection = class extends original {
      constructor(config?: RTCConfiguration) { super(config); state.testPeers.push(this) }
    }
  })
}

for (const mode of ['video', 'audio'] as const) {
  test(`${mode}: invitation, approval, encrypted media, chat, controls and end`, async ({ page: host, browser }) => {
    const errors: string[] = []
    host.on('pageerror', err => errors.push(err.message))
    await watchPeers(host)
    await host.goto('/')
    await host.getByLabel('Как вас зовут?').fill('Аня')
    await host.getByLabel('Название комнаты').fill(`Тест ${mode}`)
    if (mode === 'audio') {
      await host.getByRole('button', { name: 'Аудиозвонок', exact: true }).click()
      await expect(host.getByRole('button', { name: 'Аудиозвонок', exact: true })).toHaveAttribute('aria-pressed', 'true')
    }
    await host.getByRole('button', { name: 'Создать комнату', exact: true }).click()
    await expect(host.getByRole('heading', { name: 'Готовы к встрече?' })).toBeVisible()
    await expect(host.getByRole('button', { name: mode === 'audio' ? 'Только аудио' : 'С видео', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await host.getByRole('button', { name: 'Скопировать приглашение', exact: true }).click()
    const invitation = await host.getByLabel('Личная ссылка').inputValue()
    expect(invitation).toContain('#invite=')
    await host.keyboard.press('Escape')
    await host.getByRole('button', { name: 'Войти в комнату', exact: true }).click()
    await expect(host.getByText('Всё готово. Не хватает только вас двоих.')).toBeVisible()

    const guestContext = await browser.newContext({ permissions })
    const guest = await guestContext.newPage()
    guest.on('pageerror', err => errors.push(err.message))
    await watchPeers(guest)
    await guest.goto(invitation)
    await expect(guest.getByRole('heading', { name: 'Готовы к встрече?' })).toBeVisible()
    expect(guest.url()).not.toContain('#invite=')
    await guest.getByLabel('Ваше имя').fill('Борис')
    if (mode === 'audio') await guest.getByRole('button', { name: 'Только аудио', exact: true }).click()
    await guest.getByRole('button', { name: 'Присоединиться', exact: true }).click()
    await expect(guest.getByRole('heading', { name: 'Ожидаем подтверждения' })).toBeVisible()
    await expect(host.getByText('Борис хочет присоединиться')).toBeVisible()
    expect(await guest.evaluate(() => (window as any).testPeers.length)).toBe(0)
    const roomId = new URL(invitation).pathname.split('/').at(-1)
    const unauthorizedIce = await guest.request.get(`${origin}/api/rooms/${roomId}/ice`)
    expect(unauthorizedIce.status()).toBe(403)
    await host.getByRole('button', { name: 'Впустить', exact: true }).click()
    await expect(host.getByText('На связи', { exact: false })).toBeVisible()
    await expect(guest.getByText('На связи', { exact: false })).toBeVisible()

    for (const page of [host, guest]) {
      await expect.poll(async () => page.evaluate(async () => {
        const peer = (window as any).testPeers.findLast((item: RTCPeerConnection) => item.connectionState === 'connected') as RTCPeerConnection | undefined
        if (!peer) return false
        const stats = [...(await peer.getStats()).values()]
        return stats.some(item => item.type === 'transport' && item.dtlsState === 'connected') && stats.some(item => item.type === 'inbound-rtp' && item.kind === 'audio' && item.bytesReceived > 0)
      })).toBe(true)
    }
    if (mode === 'video') {
      await expect.poll(() => guest.evaluate(async () => {
        const peer = (window as any).testPeers.findLast((item: RTCPeerConnection) => item.connectionState === 'connected')
        return [...(await peer.getStats()).values()].some((item: any) => item.type === 'inbound-rtp' && item.kind === 'video' && item.framesDecoded > 0)
      })).toBe(true)
    } else {
      expect(await host.evaluate(() => (window as any).testPeers.at(-1).getSenders().filter((sender: RTCRtpSender) => sender.track?.kind === 'video').length)).toBe(0)
    }
    await host.getByLabel('Сообщение', { exact: true }).fill('Привет, Борис!')
    await host.getByRole('button', { name: 'Отправить сообщение', exact: true }).click()
    await expect(guest.getByText('Привет, Борис!', { exact: true })).toBeVisible()
    await guest.getByLabel('Сообщение', { exact: true }).fill('Привет, Аня! <script>alert(1)</script>')
    await guest.getByRole('button', { name: 'Отправить сообщение', exact: true }).click()
    await expect(host.getByText('Привет, Аня! <script>alert(1)</script>', { exact: true })).toBeVisible()
    await host.getByRole('button', { name: 'Выключить микрофон', exact: true }).click()
    await expect(host.getByRole('button', { name: 'Включить микрофон', exact: true })).toBeVisible()
    expect(await host.evaluate(() => (window as any).testPeers.at(-1).getSenders().find((sender: RTCRtpSender) => sender.track?.kind === 'audio').track.enabled)).toBe(false)
    if (mode === 'video') await host.getByRole('button', { name: 'Выключить камеру', exact: true }).click()
    await host.getByRole('button', { name: 'Включить камеру', exact: true }).click()
    await expect.poll(() => host.evaluate(() => (window as any).testPeers.at(-1).getSenders().some((sender: RTCRtpSender) => sender.track?.kind === 'video' && sender.track.readyState === 'live'))).toBe(true)

    if (mode === 'video') {
      await guest.reload()
      await guest.getByRole('button', { name: 'Присоединиться', exact: true }).click()
      await expect(guest.getByText('На связи', { exact: false })).toBeVisible()
      await expect(host.getByText('На связи', { exact: false })).toBeVisible()
      await expect(guest.getByLabel('Сообщение', { exact: true })).toBeEnabled()
    }
    await host.getByRole('button', { name: 'Завершить', exact: true }).click()
    await expect(host.getByRole('heading', { name: 'Хорошо, что поговорили.' })).toBeVisible()
    await expect(guest.getByRole('heading', { name: 'Хорошо, что поговорили.' })).toBeVisible()
    expect(errors).toEqual([])
    await guestContext.close()
  })
}

test('HTTP and WebSocket access controls reject outsiders and cross-origin requests', async ({ browser, request }) => {
  const badOrigin = await request.post('/api/rooms', { headers: { origin: 'https://attacker.example' }, data: { name: 'Аня', title: 'Приватно', mode: 'audio' } })
  expect(badOrigin.status()).toBe(403)
  const invalid = await request.post('/api/rooms', { headers: { origin }, data: { name: '', title: 'Приватно', mode: 'audio' } })
  expect(invalid.status()).toBe(400)
  const created = await request.post('/api/rooms', { headers: { origin }, data: { name: 'Аня', title: 'Приватно', mode: 'audio' } })
  expect(created.status()).toBe(200)
  const { room, invite } = await created.json()
  const cookies = created.headers()['set-cookie']!
  expect(cookies).toContain('HttpOnly')
  expect(cookies).toContain('SameSite=Strict')
  const stranger = await browser.newContext()
  expect((await stranger.request.get(`${origin}/api/rooms/${room.id}`)).status()).toBe(401)
  const strangerPage = await stranger.newPage()
  await strangerPage.goto(origin)
  expect(await strangerPage.evaluate(id => new Promise<boolean>((resolve) => {
    const socket = new WebSocket(`ws://localhost:3000/api/rooms/${id}/socket`)
    socket.onopen = () => { socket.close(); resolve(false) }
    socket.onerror = () => resolve(true)
  }), room.id)).toBe(true)
  const rotated = await request.post(`/api/rooms/${room.id}/invite`, { headers: { origin }, data: {} })
  const newInvite = (await rotated.json()).invite
  expect((await stranger.request.post(`${origin}/api/rooms/${room.id}/join`, { headers: { origin }, data: { invite, name: 'Посторонний' } })).status()).toBe(403)
  expect((await stranger.request.post(`${origin}/api/rooms/${room.id}/join`, { headers: { origin }, data: { invite: newInvite, name: 'Борис' } })).status()).toBe(200)
  const third = await browser.newContext()
  expect((await third.request.post(`${origin}/api/rooms/${room.id}/join`, { headers: { origin }, data: { invite: newInvite, name: 'Третий' } })).status()).toBe(403)
  expect((await stranger.request.post(`${origin}/api/rooms/${room.id}/invite`, { headers: { origin }, data: {} })).status()).toBe(403)
  await request.post(`/api/rooms/${room.id}/leave`, { headers: { origin }, data: {} })
  expect((await stranger.request.get(`${origin}/api/rooms/${room.id}`)).status()).toBe(404)
  await stranger.close()
  await third.close()
})

test('mobile layout fits the viewport and invitation errors are actionable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Присоединиться', exact: true }).click()
  await page.getByLabel('Ссылка приглашения').fill('https://attacker.example/room/fake#invite=stolen')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('полную ссылку')
})
