<script setup lang="ts">
import type { Participant } from '#shared/types/room.ts'
import type { ChatMessage } from '~/composables/useCall'

defineProps<{ messages: ChatMessage[]; other?: Participant; chatReady: boolean; draft: string }>()
const emit = defineEmits<{ close: []; 'update:draft': [value: string]; send: [] }>()
function messageTime(time: number) {
	return new Date(time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}
</script>
<template>
	<aside class="chat-panel" aria-label="Чат комнаты">
		<div class="chat-heading">
			<h2><UIcon name="i-lucide-messages-square" /> Чат комнаты</h2>
			<button aria-label="Закрыть чат" @click="emit('close')"><UIcon name="i-lucide-x" /></button>
		</div>
		<div class="chat-security"><UIcon name="i-lucide-lock-keyhole" /> Только между вами</div>
		<div class="chat-messages" role="log" aria-live="polite" aria-relevant="additions">
			<div v-if="!messages.length" class="chat-empty">
				<span><UIcon name="i-lucide-message-circle" /></span>
				<h3>Для слов и не только</h3>
				<p>
					Ссылки, идеи или просто «привет».<br />{{
						chatReady ? 'Напишите первое сообщение.' : 'Чат откроется, когда вы соединитесь.'
					}}
				</p>
			</div>
			<div
				v-for="message in messages"
				:key="message.id"
				:class="['chat-message', { mine: message.mine }]"
				data-chat-message
			>
				<span class="message-sender">{{ message.mine ? 'Вы' : other?.name }}</span>
				<p>{{ message.text }}</p>
				<time>{{ messageTime(message.time) }}</time>
			</div>
		</div>
		<form class="chat-compose" @submit.prevent="emit('send')">
			<label class="sr-only" for="chat-input">Сообщение</label
			><input
				id="chat-input"
				:value="draft"
				autocomplete="off"
				:disabled="!chatReady"
				maxlength="2000"
				placeholder="Напишите сообщение…"
				@input="emit('update:draft', ($event.target as HTMLInputElement).value)"
			/><button type="submit" :disabled="!chatReady || !draft.trim()" aria-label="Отправить сообщение">
				<UIcon name="i-lucide-arrow-up" />
			</button>
		</form>
		<p class="chat-footnote">История исчезнет, когда вы покинете комнату</p>
	</aside>
</template>
