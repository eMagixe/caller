<script setup lang="ts">
import type { CallMode } from '#shared/types/room.ts'

const user = useUser()
const users = await user.getAll()
const selectedUser = ref<User | null>(null)

function selectUser(item: User) {
	selectedUser.value = item
	toCall('video')
}

const isCurrentItem = computed(() => (item: User) => item.id === selectedUser.value?.id)

const toast = useToast()

function toCall(mode: CallMode) {
	if (!selectedUser.value) {
		toast.add({ title: 'Вызов', color: 'error', description: 'Пользователь не выбран' })
	} else {
		createRoom(selectedUser.value.id)
	}
}

async function createRoom(id: string) {
	await navigateTo(`/dashboard/room/${id}`)
}
</script>

<template>
	<main class="flex flex-row h-[calc(100vh-96px)] gap-5">
		<UScrollArea class="w-1/4 not-sm:w-full h-full">
			<UCard
				@click="selectUser(item as User)"
				class="m-0.5 w-full cursor-pointer"
				:class="{ 'bg-primary/20!': isCurrentItem(item) }"
				v-for="item in users as User[]"
				:key="item.id"
			>
				<div class="flex flex-row justify-between items-center">
					<p class="text-gray-700">{{ item.firstName }} {{ item.lastName }}</p>
				</div>
			</UCard>
		</UScrollArea>
	</main>
</template>
