<script setup lang="ts">
import type { RoomSnapshot } from '../../../shared/types/room'
import { errorMessage } from '~/utils/errors'

const route = useRoute()
const id = String(route.params.id)
const call = useCall(id)
const { room, self, other, localStream, remoteStream, audioEnabled, videoEnabled, remoteAudio, remoteVideo, connected, socketOnline, joined, connecting, error, ended, hasTurn, chatReady, messages, connectedAt } = call
const loading = ref(true)
const loadError = ref('')
const name = ref('')
const useVideo = ref(true)
const guestInvite = ref('')
const hostInvite = ref('')
const inviteOpen = ref(false)
const securityOpen = ref(false)
const chatOpen = ref(true)
const inviteBusy = ref(false)
const copied = ref(false)
const draft = ref('')
const chatList = useTemplateRef('chatList')
const now = ref(Date.now())
const leaving = ref(false)
const unread = ref(0)
const shareUrl = computed(() => hostInvite.value && import.meta.client ? `${location.origin}/room/${id}#invite=${hostInvite.value}` : '')
const duration = computed(() => {
  const seconds = connectedAt.value ? Math.max(0, Math.floor((now.value - connectedAt.value) / 1000)) : 0
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
})
const initial = (value?: string) => value?.trim().charAt(0).toUpperCase() || '?'
const waitingTitle = computed(() => {
  if (!socketOnline.value) return 'Соединяемся с комнатой…'
  if (!self.value?.approved) return 'Ожидаем подтверждения'
  if (other.value && !other.value.approved) return 'Собеседник на пороге'
  if (other.value?.online) return 'Устанавливаем соединение…'
  return 'Всё готово. Не хватает только вас двоих.'
})
let timer: ReturnType<typeof setInterval>
let copyTimer: ReturnType<typeof setTimeout>

async function loadRoom() {
  loading.value = true
  loadError.value = ''
  try {
    room.value = await $fetch<RoomSnapshot>(`/api/rooms/${id}`)
    name.value = self.value?.name || ''
    useVideo.value = room.value.mode === 'video'
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (!guestInvite.value || status !== 401) loadError.value = errorMessage(err, 'Не удалось открыть комнату.')
  } finally { loading.value = false }
}

onMounted(async () => {
  const token = new URLSearchParams(location.hash.slice(1)).get('invite')
  if (token) {
    guestInvite.value = token
    sessionStorage.setItem(`guest-invite:${id}`, token)
    history.replaceState(history.state, '', location.pathname)
  } else guestInvite.value = sessionStorage.getItem(`guest-invite:${id}`) || ''
  hostInvite.value = sessionStorage.getItem(`invite:${id}`) || ''
  timer = setInterval(() => { now.value = Date.now() }, 1000)
  await loadRoom()
})
onBeforeUnmount(() => { clearInterval(timer); clearTimeout(copyTimer) })

watch(other, (person) => {
  if (person && self.value?.role === 'host') {
    hostInvite.value = ''
    sessionStorage.removeItem(`invite:${id}`)
    inviteOpen.value = false
  }
})
watch(() => messages.value.length, async () => {
  if (!chatOpen.value && messages.value.at(-1)?.mine === false) unread.value++
  await nextTick()
  chatList.value?.scrollTo({ top: chatList.value.scrollHeight, behavior: 'smooth' })
})
watch(chatOpen, async (open) => {
  if (open) { unread.value = 0; await nextTick(); chatList.value?.scrollTo({ top: chatList.value.scrollHeight }) }
})

async function makeInvite() {
  inviteBusy.value = true
  error.value = ''
  try {
    const result = await $fetch<{ invite: string }>(`/api/rooms/${id}/invite`, { method: 'POST', body: {} })
    hostInvite.value = result.invite
    sessionStorage.setItem(`invite:${id}`, result.invite)
    copied.value = false
  } catch (err) { error.value = errorMessage(err) }
  finally { inviteBusy.value = false }
}
async function openInvite() {
  if (!hostInvite.value) await makeInvite()
  if (hostInvite.value) inviteOpen.value = true
}
async function copyInvite() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2500)
  } catch { error.value = 'Не удалось скопировать автоматически. Выделите и скопируйте ссылку вручную.' }
}
function sendMessage() { if (call.sendChat(draft.value)) draft.value = '' }
function messageTime(time: number) { return new Date(time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
async function leave() { leaving.value = true; await call.leave(); leaving.value = false }
</script>

<template>
  <div class="room-page">
    <AppHeader />
    <main v-if="loading" class="center-page" aria-live="polite"><UIcon name="i-lucide-loader-circle" class="loading-icon" /><h1>Открываем вашу комнату…</h1></main>
    <main v-else-if="loadError" class="center-page"><span class="large-icon"><UIcon name="i-lucide-door-closed" /></span><h1>Не получилось войти</h1><p role="alert">{{ loadError }}</p><div class="inline-actions"><UButton color="neutral" variant="soft" @click="loadRoom">Попробовать снова</UButton><UButton to="/">На главную</UButton></div></main>
    <main v-else-if="ended" class="center-page"><span class="large-icon"><UIcon name="i-lucide-heart-handshake" /></span><span class="eyebrow">ДО НОВОЙ ВСТРЕЧИ</span><h1>Хорошо, что поговорили.</h1><p>{{ ended }}</p><UButton to="/" size="xl" trailing-icon="i-lucide-arrow-right">Вернуться на главную</UButton></main>

    <main v-else-if="!joined" class="prejoin-main">
      <NuxtLink to="/" class="back-link"><UIcon name="i-lucide-arrow-left" /> На главную</NuxtLink>
      <section class="prejoin-card">
        <div class="prejoin-visual"><span class="eyebrow">МЕСТО ДЛЯ ВАШЕГО РАЗГОВОРА</span><div class="prejoin-avatar">{{ initial(name || self?.name) }}<span class="avatar-spark">✳</span></div><h2>{{ room?.title || 'Вас пригласили в Caller' }}</h2><p>Никакой суеты. Просто вы и собеседник.</p><span class="prejoin-lock"><UIcon name="i-lucide-lock-keyhole" /> Приватная комната на двоих</span></div>
        <form class="prejoin-form" @submit.prevent="call.join(name.trim(), guestInvite, useVideo)">
          <span class="eyebrow">ПЕРЕД ТЕМ КАК НАЧАТЬ</span><h1>Готовы к встрече?</h1><p>Выберите, как хотите общаться.<br>Микрофон и камеру можно отключить в любой момент.</p>
          <label class="field-label" for="guest-name">Ваше имя<input id="guest-name" v-model="name" required maxlength="40" :disabled="!!self || connecting" autocomplete="given-name" placeholder="Как к вам обращаться?"></label>
          <div class="mode-switch"><button type="button" :class="{ active: useVideo }" :aria-pressed="useVideo" @click="useVideo = true"><UIcon name="i-lucide-video" /> С видео</button><button type="button" :class="{ active: !useVideo }" :aria-pressed="!useVideo" @click="useVideo = false"><UIcon name="i-lucide-headphones" /> Только аудио</button></div>
          <p v-if="error" class="error-banner" role="alert">{{ error }}</p>
          <UButton type="submit" size="xl" class="create-button" :loading="connecting" :disabled="!name.trim()" trailing-icon="i-lucide-arrow-right">{{ self?.role === 'host' ? 'Войти в комнату' : 'Присоединиться' }}</UButton>
          <p class="form-note"><UIcon name="i-lucide-info" /> {{ self?.role === 'host' ? 'Браузер запросит доступ к вашим устройствам' : 'Организатор подтвердит ваш вход' }}</p>
          <button v-if="self?.role === 'host' && !other" type="button" class="text-button" @click="openInvite"><UIcon name="i-lucide-link" /> Скопировать приглашение</button>
        </form>
      </section>
    </main>

    <main v-else class="call-main">
      <div class="room-heading"><div><div class="eyebrow">ВАШЕ ЛИЧНОЕ ПРОСТРАНСТВО</div><h1>{{ room?.title }}</h1></div><div class="room-badges"><span :class="['connection-badge', { live: connected }]"><span class="status-dot" /> {{ connected ? 'На связи' : 'Ожидание' }} <span v-if="connected">· {{ duration }}</span></span><button class="secure-badge" @click="securityOpen = true"><UIcon name="i-lucide-shield-check" /> Под защитой</button></div></div>
      <div v-if="error" class="error-banner call-error" role="alert"><span>{{ error }}</span><UButton size="xs" color="neutral" variant="soft" @click="call.reconnect">Переподключиться</UButton><button aria-label="Скрыть сообщение" @click="error = ''"><UIcon name="i-lucide-x" /></button></div>
      <div v-if="self?.role === 'host' && other && !other.approved" class="approval-banner" role="status"><span class="guest-initial">{{ initial(other.name) }}</span><div><strong>{{ other.name }} хочет присоединиться</strong><p>Убедитесь, что вы приглашали этого человека.</p></div><div class="inline-actions"><UButton color="neutral" variant="soft" @click="call.send({ type: 'reject', participantId: other.id })">Отклонить</UButton><UButton icon="i-lucide-check" @click="call.send({ type: 'approve', participantId: other.id })">Впустить</UButton></div></div>
      <div :class="['call-layout', { 'chat-hidden': !chatOpen }]">
        <section class="call-stage" aria-label="Звонок">
          <div class="stage-top"><span><UIcon name="i-lucide-lock-keyhole" /> {{ connected ? 'Зашифрованный разговор' : 'Приватная комната' }}</span><span><UIcon name="i-lucide-users" /> {{ room?.participants.filter(person => person.approved && person.online).length || 1 }} / 2</span></div>
          <MediaVideo v-if="remoteStream" :stream="remoteStream" :class="['remote-video', { 'audio-only-video': !remoteVideo }]" />
          <div v-if="!connected || !remoteVideo" class="stage-placeholder">
            <div :class="['call-avatar', { 'is-connected': connected }]">{{ connected ? initial(other?.name) : '' }}<UIcon v-if="!connected" :name="self?.approved ? 'i-lucide-coffee' : 'i-lucide-hourglass'" /><span v-if="connected && remoteAudio" class="avatar-speaking"><i /><i /><i /></span></div>
            <h2>{{ connected ? other?.name : waitingTitle }}</h2>
            <p v-if="connected">{{ remoteAudio ? 'Рядом, даже без камеры' : 'Микрофон собеседника выключен' }}</p>
            <p v-else-if="!self?.approved">Организатор скоро впустит вас.<br>До подтверждения ваши видео и звук не передаются.</p>
            <p v-else>Отправьте личное приглашение.<br>Ваш собеседник появится здесь.</p>
            <UButton v-if="self?.role === 'host' && !other" color="neutral" variant="soft" icon="i-lucide-link" class="stage-invite" @click="openInvite">Пригласить собеседника</UButton>
          </div>
          <div v-if="connected" class="remote-name"><span class="status-dot" /> {{ other?.name }}<UIcon v-if="!remoteAudio" name="i-lucide-mic-off" /></div>
          <div class="self-preview"><MediaVideo v-if="localStream && videoEnabled" :stream="localStream" muted mirror /><div v-else class="self-avatar">{{ initial(self?.name) }}</div><span class="self-name">Вы<UIcon v-if="!audioEnabled" name="i-lucide-mic-off" /></span></div>
          <div class="stage-bottom-note"><UIcon name="i-lucide-shield-check" /> Аудио и видео не записываются</div>
        </section>

        <aside v-if="chatOpen" class="chat-panel" aria-label="Чат">
          <div class="chat-heading"><h2><UIcon name="i-lucide-messages-square" /> Чат комнаты</h2><button aria-label="Закрыть чат" @click="chatOpen = false"><UIcon name="i-lucide-x" /></button></div>
          <div class="chat-security"><UIcon name="i-lucide-lock-keyhole" /> Только между вами</div>
          <div ref="chatList" class="chat-messages" role="log" aria-live="polite" aria-relevant="additions">
            <div v-if="!messages.length" class="chat-empty"><span><UIcon name="i-lucide-message-circle" /></span><h3>Для слов и не только</h3><p>Ссылки, идеи или просто «привет».<br>{{ chatReady ? 'Напишите первое сообщение.' : 'Чат откроется, когда вы соединитесь.' }}</p></div>
            <div v-for="message in messages" :key="message.id" :class="['chat-message', { mine: message.mine }]"><span class="message-sender">{{ message.mine ? 'Вы' : other?.name }}</span><p>{{ message.text }}</p><time>{{ messageTime(message.time) }}</time></div>
          </div>
          <form class="chat-compose" @submit.prevent="sendMessage"><label class="sr-only" for="chat-input">Сообщение</label><input id="chat-input" v-model="draft" autocomplete="off" :disabled="!chatReady" maxlength="2000" placeholder="Напишите сообщение…"><button type="submit" :disabled="!chatReady || !draft.trim()" aria-label="Отправить сообщение"><UIcon name="i-lucide-arrow-up" /></button></form>
          <p class="chat-footnote">История исчезнет, когда вы покинете комнату</p>
        </aside>
      </div>
      <div class="call-toolbar"><div class="toolbar-info"><span class="status-dot" :class="{ offline: !socketOnline }" /> {{ socketOnline ? 'Комната открыта' : 'Восстанавливаем связь' }}</div><div class="toolbar-controls"><UTooltip :text="audioEnabled ? 'Выключить микрофон' : 'Включить микрофон'"><button :class="['control-button', { off: !audioEnabled }]" :aria-label="audioEnabled ? 'Выключить микрофон' : 'Включить микрофон'" :aria-pressed="audioEnabled" @click="call.toggleAudio"><UIcon :name="audioEnabled ? 'i-lucide-mic' : 'i-lucide-mic-off'" /></button></UTooltip><UTooltip :text="videoEnabled ? 'Выключить камеру' : 'Включить камеру'"><button :class="['control-button', { off: !videoEnabled }]" :aria-label="videoEnabled ? 'Выключить камеру' : 'Включить камеру'" :aria-pressed="videoEnabled" @click="call.toggleVideo"><UIcon :name="videoEnabled ? 'i-lucide-video' : 'i-lucide-video-off'" /></button></UTooltip><span class="toolbar-divider" /><UTooltip text="Чат"><button :class="['control-button', { selected: chatOpen }]" aria-label="Показать или скрыть чат" :aria-pressed="chatOpen" @click="chatOpen = !chatOpen"><UIcon name="i-lucide-message-circle" /><span v-if="unread" class="unread-badge">{{ unread }}</span></button></UTooltip><UTooltip v-if="self?.role === 'host' && !other" text="Пригласить"><button class="control-button" aria-label="Пригласить собеседника" @click="openInvite"><UIcon name="i-lucide-user-plus" /></button></UTooltip><UButton class="leave-button" color="error" size="lg" icon="i-lucide-phone" :loading="leaving" @click="leave">{{ self?.role === 'host' ? 'Завершить' : 'Выйти' }}</UButton></div><button class="toolbar-security" aria-label="О защите звонка" @click="securityOpen = true"><UIcon name="i-lucide-shield-check" /> WebRTC</button></div>
      <p v-if="!hasTurn && !connected && self?.approved" class="network-note"><UIcon name="i-lucide-info" /> Если соединение не устанавливается между разными сетями, администратору нужно настроить TURN-сервер.</p>
    </main>

    <UModal v-model:open="inviteOpen" title="Разделите этот момент" description="Отправьте ссылку лично тому, кого хотите пригласить.">
      <template #body><div class="dialog-form"><div class="invite-notice"><UIcon name="i-lucide-ticket" /><span>Один гость · Одно использование · 30 минут</span></div><label class="field-label" for="share-link">Личная ссылка<input id="share-link" :value="shareUrl" readonly @focus="($event.target as HTMLInputElement).select()"></label><UButton size="lg" :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" @click="copyInvite">{{ copied ? 'Ссылка скопирована' : 'Скопировать ссылку' }}</UButton><p class="modal-note">Когда гость придёт, вы увидите его имя и сможете разрешить вход. Любой обладатель ссылки может отправить запрос — проверяйте, кого впускаете.</p><button class="text-button" :disabled="inviteBusy" @click="makeInvite"><UIcon name="i-lucide-refresh-cw" /> {{ inviteBusy ? 'Создаём…' : 'Создать новую ссылку и отозвать старую' }}</button></div></template>
    </UModal>
    <UModal v-model:open="securityOpen" title="Разговор под защитой" description="Как Caller защищает ваше общение.">
      <template #body><div class="security-details"><p><UIcon name="i-lucide-video" /><span><strong>Аудио и видео</strong>WebRTC шифрует медиапотоки через DTLS-SRTP между браузерами, в том числе при передаче через TURN.</span></p><p><UIcon name="i-lucide-message-circle" /><span><strong>Личный чат</strong>Сообщения идут по зашифрованному WebRTC DataChannel и не сохраняются на сервере.</span></p><p><UIcon name="i-lucide-user-check" /><span><strong>Контроль входа</strong>Одноразовое приглашение, подтверждение организатора и максимум два участника.</span></p><p class="modal-note">Сервер сигнализации должен быть доверенным, сайт — доступен по HTTPS. Проверка личности и защита от записи разговора собеседником не предусмотрены.</p></div></template>
    </UModal>
  </div>
</template>
