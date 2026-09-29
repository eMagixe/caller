<script setup lang="ts">
import type { CallMode, RoomSnapshot } from '#shared/types/room.ts'
import { errorMessage } from '~/utils/errors.ts'

const hydrated = ref(false)
const busy = ref(false)
const error = ref('')
const joinOpen = ref(false)
const joinLink = ref('')
const joinError = ref('')

onMounted(() => {
	hydrated.value = true
})

async function createRoom(payload: { name: string; title: string; mode: CallMode }) {
	if (busy.value) return
	busy.value = true
	error.value = ''
	try {
		const result = await $fetch<{ room: RoomSnapshot; invite: string }>('/api/rooms', {
			method: 'POST',
			body: { name: payload.name.trim(), title: payload.title.trim() || 'Личная встреча', mode: payload.mode }
		})
		sessionStorage.setItem(`invite:${result.room.id}`, result.invite)
		await navigateTo(`/dashboard/room/${result.room.id}`)
	} catch (err) {
		error.value = errorMessage(err)
	} finally {
		busy.value = false
	}
}

function openInvitation() {
	joinError.value = ''
	try {
		const url = new URL(joinLink.value.trim())
		if (
			url.origin !== location.origin ||
			!/^\/room\/[a-f0-9-]{36}$/.test(url.pathname) ||
			!url.hash.startsWith('#invite=')
		)
			throw new Error()
		navigateTo(url.pathname + url.hash)
	} catch {
		joinError.value = 'Вставьте полную ссылку приглашения в Caller.'
	}
}

function showInvitation() {
	joinError.value = ''
	joinOpen.value = true
}
</script>

<template>
	<div class="landing">
		<DashboardModalInvitation
			v-model:open="joinOpen"
			:link="joinLink"
			:error="joinError"
			@update:link="joinLink = $event"
			@submit="openInvitation"
		/>
		<main class="landing-main">
			<section class="hero">
				<div class="hero-copy">
					<h1>
						На расстоянии<br />одного <span>«привет».</span
						><svg class="title-spark" viewBox="0 0 48 48" aria-hidden="true">
							<path d="M24 4v12M24 32v12M4 24h12M32 24h12M10 10l8 8M30 30l8 8M10 38l8-8M30 18l8-8" />
						</svg>
					</h1>
					<p class="hero-description">
						Встречайтесь взглядом. Делитесь важным.<br />Приватные звонки для разговоров, которые сближают.
					</p>
					<DashboardFormCreate
						:hydrated="hydrated"
						:busy="busy"
						:error="error"
						@submit="createRoom"
						@join="showInvitation"
					/>
				</div>
			</section>
		</main>
	</div>
</template>
