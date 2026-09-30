<script setup lang="ts">
import type { CallMode } from '#shared/types/room.ts'

defineProps<{ hydrated: boolean; busy: boolean; error: string }>()
const emit = defineEmits<{ submit: [payload: { name: string; title: string; mode: CallMode }]; join: [] }>()
const mode = ref<CallMode>('video')
const name = ref('')
const title = ref('')

function submit() {
	emit('submit', { name: name.value, title: title.value, mode: mode.value })
}
</script>

<template>
	<form
		class="rounded-[17px] border border-[#ebe7ef] bg-white p-5 shadow-[0_10px_30px_#34304105] max-[600px]:p-[17px]"
		@submit.prevent="submit"
	>
		<div class="flex gap-1 rounded-[9px] border border-[#eeebf3] bg-[#f4f2f7] p-1" aria-label="Формат звонка">
			<button
				type="button"
				:disabled="!hydrated || busy"
				:class="{ active: mode === 'video' }"
				:aria-pressed="mode === 'video'"
				class="flex h-[38px] flex-1 items-center justify-center gap-2 rounded-[6px] text-[12px] text-[#898391] transition-colors [&.active]:bg-white [&.active]:font-semibold [&.active]:text-[#7148d8] [&.active]:shadow-[0_2px_5px_#41384f0c]"
				@click="mode = 'video'"
			>
				<UIcon class="text-[17px]" name="i-lucide-video" /> Видеозвонок
			</button>
			<button
				type="button"
				:disabled="!hydrated || busy"
				:class="{ active: mode === 'audio' }"
				:aria-pressed="mode === 'audio'"
				class="flex h-[38px] flex-1 items-center justify-center gap-2 rounded-[6px] text-[12px] text-[#898391] transition-colors [&.active]:bg-white [&.active]:font-semibold [&.active]:text-[#7148d8] [&.active]:shadow-[0_2px_5px_#41384f0c]"
				@click="mode = 'audio'"
			>
				<UIcon class="text-[17px]" name="i-lucide-headphones" /> Аудиозвонок
			</button>
		</div>
		<div
			class="my-[22px] mb-[18px] grid gap-[14px] [grid-template-columns:0.85fr_1.25fr] max-[1100px]:gap-[15px] max-[1100px]:[grid-template-columns:1fr] max-[600px]:my-5 max-[600px]:gap-3 max-[600px]:[grid-template-columns:1fr_1.25fr]"
		>
			<label class="field-label" for="name"
				>Как вас зовут?<input
					id="name"
					v-model="name"
					placeholder="Ваше имя"
					maxlength="40"
					autocomplete="given-name"
					required
					:disabled="!hydrated || busy"
			/></label>
			<label class="field-label" for="title"
				>Название комнаты <span>необязательно</span
				><input
					id="title"
					v-model="title"
					placeholder="Например, вечерний разговор"
					maxlength="80"
					:disabled="!hydrated || busy"
			/></label>
		</div>
		<p v-if="error" class="error-banner" role="alert">{{ error }}</p>
		<UButton
			class="min-h-[45px] w-full justify-center gap-3 rounded-[8px] bg-violet text-[12px] font-semibold shadow-[0_3px_6px_#7650e716] disabled:opacity-60"
			type="submit"
			size="xl"
			:loading="busy"
			:disabled="!hydrated || !name.trim()"
			trailing-icon="i-lucide-arrow-right"
			>Создать комнату</UButton
		>
	</form>
</template>
