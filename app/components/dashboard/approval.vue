<script setup lang="ts">
import type { Participant } from '#shared/types/room.ts'

defineProps<{ other: Participant }>()
defineEmits<{ approve: []; reject: [] }>()
</script>
<template>
	<div class="mb-[18px] flex items-center gap-[15px] rounded-[12px] border border-[#e5d5f7] bg-[#f1eafa] px-5 py-[15px] max-[800px]:flex-wrap max-[600px]:gap-2.5 max-[600px]:p-[13px]" role="status">
		<span class="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#e3d1f2] text-[#9b70bf]">{{ other.name.trim().charAt(0).toUpperCase() || '?' }}</span>
		<div class="flex-1">
			<strong class="text-[12px]">{{ other.name }} хочет присоединиться</strong>
			<p class="mt-1 text-[10px] text-[#a089b2]">Убедитесь, что вы приглашали этого человека.</p>
		</div>
		<div class="inline-actions max-[800px]:ml-[50px] max-[600px]:ml-[46px]">
			<UButton class="text-[11px]" color="neutral" variant="soft" @click="$emit('reject')">Отклонить</UButton
			><UButton class="text-[11px]" icon="i-lucide-check" @click="$emit('approve')">Впустить</UButton>
		</div>
	</div>
</template>
