<script setup lang="ts">
import { useProfile } from '#imports'

const profile = useProfile()
const me = await profile.getUser()
</script>

<template>
	<pre>
		{{ me }}
	</pre>
</template>

<style scoped></style>
