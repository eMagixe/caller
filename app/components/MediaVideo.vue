<script setup lang="ts">
const props = defineProps<{ stream?: MediaStream; muted?: boolean; mirror?: boolean }>()
const element = useTemplateRef('video')
const needsPlayback = ref(false)
async function play() {
  try { await element.value?.play(); needsPlayback.value = false }
  catch { needsPlayback.value = true }
}
watch([() => props.stream, element], () => {
  if (!element.value) return
  element.value.srcObject = props.stream || null
  if (props.stream) play()
}, { flush: 'post' })
</script>

<template>
  <div class="media-wrapper">
    <video ref="video" autoplay playsinline :muted="muted" :class="{ mirrored: mirror }" />
    <button v-if="needsPlayback" class="playback-button" @click="play"><UIcon name="i-lucide-volume-2" /> Включить воспроизведение</button>
  </div>
</template>
