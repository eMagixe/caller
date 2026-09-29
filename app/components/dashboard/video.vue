<script setup lang="ts">
const props = defineProps<{ stream?: MediaStream; muted?: boolean; mirror?: boolean }>()
const element = useTemplateRef('video')
const needsPlayback = ref(false)
async function play() {
	try {
		await element.value?.play()
		needsPlayback.value = false
	} catch {
		needsPlayback.value = true
	}
}
watch(
	[() => props.stream, element],
	() => {
		if (!element.value) return
		element.value.srcObject = props.stream || null
		if (props.stream) play()
	},
	{ flush: 'post' }
)
</script>

<template>
	<div class="relative h-full w-full">
		<video ref="video" autoplay playsinline :muted="muted" class="h-full w-full object-cover" :class="{ 'scale-x-[-1]': mirror }" />
		<button v-if="needsPlayback" class="absolute left-1/2 top-[55px] z-[8] -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-white px-[13px] py-[9px] text-[12px] text-[#6f4c98]" @click="play">
			<UIcon name="i-lucide-volume-2" /> Включить воспроизведение
		</button>
	</div>
</template>
