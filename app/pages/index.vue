<script setup lang="ts">
import type { CallMode, RoomSnapshot } from '../../shared/types/room'
import { errorMessage } from '~/utils/errors'

const hydrated = ref(false)
onMounted(() => { hydrated.value = true })
const mode = ref<CallMode>('video')
const name = ref('')
const title = ref('')
const busy = ref(false)
const error = ref('')
const joinOpen = ref(false)
const joinLink = ref('')
const joinError = ref('')

async function createRoom() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await $fetch<{ room: RoomSnapshot; invite: string }>('/api/rooms', {
      method: 'POST', body: { name: name.value.trim(), title: title.value.trim() || 'Личная встреча', mode: mode.value },
    })
    sessionStorage.setItem(`invite:${result.room.id}`, result.invite)
    await navigateTo(`/room/${result.room.id}`)
  } catch (err) { error.value = errorMessage(err) }
  finally { busy.value = false }
}

function openInvitation() {
  joinError.value = ''
  try {
    const url = new URL(joinLink.value.trim())
    if (url.origin !== location.origin || !/^\/room\/[a-f0-9-]{36}$/.test(url.pathname) || !url.hash.startsWith('#invite=')) throw new Error()
    navigateTo(url.pathname + url.hash)
  } catch { joinError.value = 'Вставьте полную ссылку приглашения в Caller.' }
}
</script>

<template>
  <div class="landing">
    <AppHeader />
    <main class="landing-main">
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow"><span class="status-dot" /> ВАШ РАЗГОВОР. ВАШЕ ПРОСТРАНСТВО.</div>
          <h1>На расстоянии<br>одного <span>«привет».</span><svg class="title-spark" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4v12M24 32v12M4 24h12M32 24h12M10 10l8 8M30 30l8 8M10 38l8-8M30 18l8-8" /></svg></h1>
          <p class="hero-description">Встречайтесь взглядом. Делитесь важным.<br>Приватные звонки для разговоров, которые сближают.</p>
          <form class="create-card" @submit.prevent="createRoom">
            <div class="mode-switch" aria-label="Формат звонка">
              <button type="button" :disabled="!hydrated || busy" :class="{ active: mode === 'video' }" :aria-pressed="mode === 'video'" @click="mode = 'video'"><UIcon name="i-lucide-video" /> Видеозвонок</button>
              <button type="button" :disabled="!hydrated || busy" :class="{ active: mode === 'audio' }" :aria-pressed="mode === 'audio'" @click="mode = 'audio'"><UIcon name="i-lucide-headphones" /> Аудиозвонок</button>
            </div>
            <div class="form-row">
              <label class="field-label" for="name">Как вас зовут?<input id="name" v-model="name" placeholder="Ваше имя" maxlength="40" autocomplete="given-name" required :disabled="!hydrated || busy"></label>
              <label class="field-label" for="title">Название комнаты <span>необязательно</span><input id="title" v-model="title" placeholder="Например, вечерний разговор" maxlength="80" :disabled="!hydrated || busy"></label>
            </div>
            <p v-if="error" class="error-banner" role="alert">{{ error }}</p>
            <UButton class="create-button" type="submit" size="xl" :loading="busy" :disabled="!hydrated || !name.trim()" trailing-icon="i-lucide-arrow-right">Создать комнату</UButton>
            <p class="form-note"><UIcon name="i-lucide-lock-keyhole" /> Только вы и тот, кого вы пригласите</p>
          </form>
          <p class="have-invite">Уже есть приглашение? <button :disabled="!hydrated" @click="joinOpen = true">Присоединиться <UIcon name="i-lucide-arrow-up-right" /></button></p>
        </div>

        <div class="hero-art" aria-label="Иллюстрация приватного звонка">
          <div class="art-orbit orbit-one" /><div class="art-orbit orbit-two" />
          <span class="art-star star-one">✳</span><span class="art-star star-two">✧</span>
          <div class="floating-label privacy-label"><span class="privacy-icon"><UIcon name="i-lucide-shield-check" /></span><div><strong>Между нами</strong><span>Разговор под защитой</span></div><span class="small-check"><UIcon name="i-lucide-check" /></span></div>
          <div class="illustration-call">
            <div class="illustration-top"><span><span class="status-dot" /> Личная встреча</span><UIcon name="i-lucide-lock-keyhole" /></div>
            <div class="illustration-people">
              <div class="person-card person-lilac"><div class="person-orb"><div class="orb-eye eye-left" /><div class="orb-eye eye-right" /><div class="orb-smile" /></div><span class="person-tag"><span class="tiny-wave"><i /><i /><i /></span> Саша</span><span class="person-decoration">✦</span></div>
              <div class="person-card person-peach"><div class="person-orb"><div class="orb-eye eye-left" /><div class="orb-eye eye-right" /><div class="orb-smile" /></div><span class="person-tag">Вы</span><span class="person-decoration">✺</span></div>
            </div>
            <div class="illustration-controls"><span><UIcon name="i-lucide-mic" /></span><span><UIcon name="i-lucide-video" /></span><span class="hangup"><UIcon name="i-lucide-phone" /></span><span><UIcon name="i-lucide-message-circle" /></span><span><UIcon name="i-lucide-more-horizontal" /></span></div>
          </div>
          <div class="floating-label message-label"><span class="message-avatar">С</span><div><strong>Так здорово тебя видеть! <span>👋</span></strong><span>Ближе, даже если далеко</span></div></div>
          <div class="art-caption"><span class="caption-line" /> Хорошие разговоры начинаются здесь</div>
        </div>
      </section>
      <section class="benefits" aria-label="Почему Caller">
        <article><span class="benefit-icon lilac"><UIcon name="i-lucide-zap" /></span><div><h2>Сразу к разговору</h2><p>Без регистрации и установки.<br>Создайте комнату и поделитесь ссылкой.</p></div></article>
        <article><span class="benefit-icon mint"><UIcon name="i-lucide-shield-check" /></span><div><h2>Личное остаётся личным</h2><p>Шифрование аудио, видео и чата.<br>Вход — только с вашего разрешения.</p></div></article>
        <article><span class="benefit-icon peach"><UIcon name="i-lucide-messages-square" /></span><div><h2>Больше способов быть рядом</h2><p>С камерой или только голосом.<br>А нужные слова всегда можно написать.</p></div></article>
      </section>
    </main>
    <footer class="app-footer"><span>© {{ new Date().getFullYear() }} Caller</span><span>Создано для живого общения <span class="footer-flower">✳</span></span><span><span class="status-dot" /> Без записей разговоров</span></footer>
    <UModal v-model:open="joinOpen" title="Вас уже ждут" description="Вставьте ссылку, которой с вами поделился собеседник.">
      <template #body><form class="dialog-form" @submit.prevent="openInvitation"><label class="field-label" for="invite-link">Ссылка приглашения<input id="invite-link" v-model="joinLink" placeholder="https://…/room/…#invite=…" required type="url"></label><p v-if="joinError" class="error-banner" role="alert">{{ joinError }}</p><UButton type="submit" size="lg" trailing-icon="i-lucide-arrow-right">Продолжить</UButton></form></template>
    </UModal>
  </div>
</template>
