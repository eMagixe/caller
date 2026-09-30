<script setup lang="ts">
import { useProfile } from '#imports'

const profile = useProfile()
const user = await profile.getUser()
</script>

<template>
	<pre>
		{{ user }}
	</pre>
</template>

<style scoped></style>
