<script setup lang="ts">
const emit = defineEmits<{
	join: []
	invite: []
}>()
</script>
<template>
	<visual-wrapper>
		<div class="flex justify-center items-center h-[calc(100vh-160px)]">
			<form @submit.prevent="emit('join')">
				<UButton type="submit" size="xl" class="create-button" trailing-icon="i-lucide-arrow-right">
					Войти
				</UButton>
			</form>
		</div>
	</visual-wrapper>
</template>
