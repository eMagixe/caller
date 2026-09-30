<script setup lang="ts">
const props = defineProps<{
	title: string
}>()
</script>

<template>
	<h2 class="text-xl text-gray-500 mb-5">{{ props.title }}</h2>
</template>
