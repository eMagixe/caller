<script setup lang="ts">
defineProps<{
	socketOnline: boolean
	audioEnabled: boolean
	videoEnabled: boolean
	chatOpen: boolean
	unread: number
	isHost: boolean
	hasOther: boolean
	leaving: boolean
}>()
const emit = defineEmits<{ audio: []; video: []; chat: []; invite: []; leave: []; security: [] }>()
</script>
<template>
	<div
		class="flex items-center justify-between gap-5 px-2 py-5.5 max-[800px]:justify-center max-[600px]:sticky max-[600px]:bottom-0 max-[600px]:z-10 max-[600px]:rounded-[12px] max-[600px]:bg-[#fbfafcef] max-[600px]:px-2 max-[600px]:py-4.5 max-[600px]:backdrop-blur-[10px]"
	>
		<div
			class="flex min-w-35 items-center gap-1.75 text-[10px] text-[#9d8caa] max-[1100px]:min-w-22.5 max-[1100px]:text-[9px] max-[800px]:hidden"
		>
			<span class="status-dot" :class="{ offline: !socketOnline }" />{{
				socketOnline ? 'Комната открыта' : 'Восстанавливаем связь'
			}}
		</div>
		<div class="flex items-center gap-2.5 max-[600px]:gap-1.75">
			<UTooltip :text="audioEnabled ? 'Выключить микрофон' : 'Включить микрофон'"
				><button
					class="relative grid h-[43px] w-[43px] place-items-center rounded-[12px] border border-[#e8e1ee] bg-white text-[18px] text-[#796788] transition-colors hover:bg-[#f1ebf9] max-[600px]:h-10 max-[600px]:w-[39px] max-[600px]:rounded-[10px] max-[600px]:text-[16px]"
					:class="{ 'border-[#e9d8e6] bg-[#f3eaf2] text-[#aa769b]': !audioEnabled }"
					:aria-pressed="audioEnabled"
					@click="emit('audio')"
				>
					<UIcon :name="audioEnabled ? 'i-lucide-mic' : 'i-lucide-mic-off'" /></button></UTooltip
			><UTooltip :text="videoEnabled ? 'Выключить камеру' : 'Включить камеру'"
				><button
					class="relative grid h-[43px] w-[43px] place-items-center rounded-[12px] border border-[#e8e1ee] bg-white text-[18px] text-[#796788] transition-colors hover:bg-[#f1ebf9] max-[600px]:h-10 max-[600px]:w-[39px] max-[600px]:rounded-[10px] max-[600px]:text-[16px]"
					:class="{ 'border-[#e9d8e6] bg-[#f3eaf2] text-[#aa769b]': !videoEnabled }"
					:aria-pressed="videoEnabled"
					@click="emit('video')"
				>
					<UIcon :name="videoEnabled ? 'i-lucide-video' : 'i-lucide-video-off'" /></button></UTooltip
			><span class="toolbar-divider" /><UTooltip text="Чат"
				><button
					class="relative grid h-[43px] w-[43px] place-items-center rounded-[12px] border border-[#e8e1ee] bg-white text-[18px] text-[#796788] transition-colors hover:bg-[#f1ebf9] max-[600px]:h-10 max-[600px]:w-[39px] max-[600px]:rounded-[10px] max-[600px]:text-[16px]"
					:class="{ 'border-[#e3d5f5] bg-[#eee7fa] text-[#8c62c8]': chatOpen }"
					aria-label="Показать или скрыть чат"
					@click="emit('chat')"
				>
					<UIcon name="i-lucide-message-circle" /><span
						v-if="unread"
						class="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-[10px] bg-violet text-[9px] text-white"
						>{{ unread }}</span
					>
				</button></UTooltip
			><UTooltip v-if="isHost && !hasOther" text="Пригласить"
				><button
					class="relative grid h-[43px] w-[43px] place-items-center rounded-[12px] border border-[#e8e1ee] bg-white text-[18px] text-[#796788] transition-colors hover:bg-[#f1ebf9] max-[600px]:h-10 max-[600px]:w-[39px] max-[600px]:rounded-[10px] max-[600px]:text-[16px]"
					aria-label="Пригласить собеседника"
					@click="emit('invite')"
				>
					<UIcon name="i-lucide-user-plus" /></button></UTooltip
			><UButton
				class="ml-[5px] h-[43px] rounded-[12px] bg-[#d96e7d] px-[18px] text-[11px] max-[600px]:ml-0 max-[600px]:h-10 max-[600px]:px-3 max-[600px]:text-[10px]"
				color="error"
				size="lg"
				icon="i-lucide-phone"
				:loading="leaving"
				@click="emit('leave')"
				>{{ isHost ? 'Завершить' : 'Выйти' }}</UButton
			>
		</div>
		<button
			class="flex min-w-[140px] items-center justify-end gap-[7px] text-[10px] text-[#9d8caa] max-[1100px]:min-w-[90px] max-[1100px]:text-[9px] max-[800px]:hidden"
			aria-label="О защите звонка"
			@click="emit('security')"
		>
			<UIcon name="i-lucide-shield-check" /> WebRTC
		</button>
	</div>
</template>
