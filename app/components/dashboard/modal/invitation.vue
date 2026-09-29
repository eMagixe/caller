<script setup lang="ts">
defineProps<{ open: boolean; link: string; error: string }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; 'update:link': [value: string]; submit: [] }>()
</script>
<template>
	<UModal
		:open="open"
		title="Вас уже ждут"
		description="Вставьте ссылку, которой с вами поделился собеседник."
		@update:open="emit('update:open', $event)"
		><template #body
			><form class="flex flex-col gap-[18px]" @submit.prevent="emit('submit')">
				<label class="field-label text-[12px]" for="invite-link"
					>Ссылка приглашения<input
						id="invite-link"
						:value="link"
						placeholder="https://…/room/…#invite=…"
						required
						type="url"
						class="h-[46px] text-[13px]"
						@input="emit('update:link', ($event.target as HTMLInputElement).value)"
				/></label>
				<p v-if="error" class="error-banner" role="alert">{{ error }}</p>
				<UButton type="submit" size="lg" trailing-icon="i-lucide-arrow-right">Продолжить</UButton>
			</form></template
		></UModal
	>
</template>
