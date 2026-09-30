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

const user = useUser()

const users = await user.getAll()
</script>

<template>
	<DashboardModalInvitation
		v-model:open="joinOpen"
		:link="joinLink"
		:error="joinError"
		@update:link="joinLink = $event"
		@submit="openInvitation"
	/>
	<div class="flex flex-row h-screen">
		<UScrollArea class="w-1/2">
			<div v-for="item in users" :key="item.id">{{ item.firstName }} {{ item.lastName }}</div>
		</UScrollArea>
		<main class="w-1/2">
			<section class="hero">
				<div class="hero-copy">
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
