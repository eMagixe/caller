<script setup lang="ts">
import type { Participant, RoomSnapshot } from '#shared/types/room.ts'

defineProps<{
	room?: RoomSnapshot
	self?: Participant
	name: string
	useVideo: boolean
	connecting: boolean
	error: string
	guestInvite: string
	hasOther: boolean
}>()
const emit = defineEmits<{
	'update:name': [value: string]
	'update:useVideo': [value: boolean]
	join: []
	invite: []
}>()

const initial = (value?: string) => value?.trim().charAt(0).toUpperCase() || '?'
</script>
<template>
	<main class="mx-auto max-w-[1030px] px-[30px] pb-[60px] pt-9 max-[800px]:px-5 max-[800px]:pb-[60px] max-[800px]:pt-7">
		<NuxtLink to="/public" class="mb-[25px] inline-flex items-center gap-[7px] text-[12px] text-[#9c8eaa]"><UIcon name="i-lucide-arrow-left" /> На главную</NuxtLink>
		<section class="grid overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_15px_60px_#42325005] [grid-template-columns:1fr_1fr] max-[600px]:[grid-template-columns:1fr]">
			<div class="flex flex-col items-center justify-center p-[42px_24px] text-center [background:radial-gradient(ellipse_at_50%_30%,#e8dff5,#f3eef8_70%)]">
				<span class="eyebrow text-[8px] max-[800px]:text-[7px] max-[600px]:hidden">МЕСТО ДЛЯ ВАШЕГО РАЗГОВОРА</span>
				<div class="relative m-[44px_0_30px] grid h-[150px] w-[150px] rotate-[-7deg] place-items-center rounded-[48px] text-[65px] text-white shadow-[10px_20px_30px_#8463b52b,inset_0_1px_1px_#ffffffaa] [background:linear-gradient(145deg,#c8b5ec,#9c7ed0)] max-[800px]:h-[125px] max-[800px]:w-[125px] max-[600px]:m-[10px_0_20px] max-[600px]:h-[85px] max-[600px]:w-[85px] max-[600px]:rounded-[28px] max-[600px]:text-[35px]">{{ initial(name || self?.name) }}<span class="absolute right-[-25px] top-[-24px] text-[60px] text-[#bba3de] max-[600px]:right-[-18px] max-[600px]:top-[-10px] max-[600px]:text-[35px]">✳</span></div>
				<h2 class="max-w-full text-[22px] font-semibold [overflow-wrap:anywhere] max-[600px]:text-[18px]">{{ room?.title || 'Вас пригласили в Caller' }}</h2>
				<p class="mt-2.5 text-[12px] text-[#a08caf] max-[600px]:hidden">Никакой суеты. Просто вы и собеседник.</p>
				<span class="mt-[45px] flex items-center gap-1.5 text-[10px] text-[#a08daf] max-[600px]:hidden"><UIcon name="i-lucide-lock-keyhole" /> Приватная комната на двоих</span>
			</div>
			<form class="flex flex-col gap-5 p-[48px_36px] max-[800px]:p-[32px_25px] max-[600px]:gap-5 max-[600px]:p-[30px_24px]" @submit.prevent="emit('join')">
				<span class="eyebrow">ПЕРЕД ТЕМ КАК НАЧАТЬ</span>
				<h1 class="text-[30px] font-semibold leading-[1.2] tracking-[-1px] max-[600px]:text-[26px]">Готовы к встрече?</h1>
				<p class="text-[12px] leading-[1.8] text-[#95889f]">Выберите, как хотите общаться.<br />Микрофон и камеру можно отключить в любой момент.</p>
				<label class="field-label mt-1 max-[600px]:text-[12px]" for="guest-name"
					>Ваше имя<input
						id="guest-name"
						:value="name"
						required
						maxlength="40"
						:disabled="!!self || connecting"
						autocomplete="given-name"
						placeholder="Как к вам обращаться?"
						@input="emit('update:name', ($event.target as HTMLInputElement).value)"
				/></label>
				<div class="mode-switch">
					<button
						type="button"
						:class="{ active: useVideo }"
						:aria-pressed="useVideo"
						@click="emit('update:useVideo', true)"
					>
						<UIcon name="i-lucide-video" /> С видео</button
					><button
						type="button"
						:class="{ active: !useVideo }"
						:aria-pressed="!useVideo"
						@click="emit('update:useVideo', false)"
					>
						<UIcon name="i-lucide-headphones" /> Только аудио
					</button>
				</div>
				<p v-if="error" class="error-banner m-0" role="alert">{{ error }}</p>
				<UButton
					type="submit"
					size="xl"
					class="create-button"
					:loading="connecting"
					:disabled="!name.trim()"
					trailing-icon="i-lucide-arrow-right"
					>{{ self?.role === 'host' ? 'Войти в комнату' : 'Присоединиться' }}</UButton
				>
				<p class="form-note mt-[-8px] text-[9px]">
					<UIcon name="i-lucide-info" />
					{{
						self?.role === 'host'
							? 'Браузер запросит доступ к вашим устройствам'
							: 'Организатор подтвердит ваш вход'
					}}
				</p>
				<button
					v-if="self?.role === 'host' && !hasOther"
					type="button"
					class="text-button"
					@click="emit('invite')"
				>
					<UIcon name="i-lucide-link" /> Скопировать приглашение
				</button>
			</form>
		</section>
	</main>
</template>
