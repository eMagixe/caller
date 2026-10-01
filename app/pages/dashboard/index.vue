<script setup lang="ts">
import type { CallMode } from '#shared/types/room.ts'

const user = useUser()
const users = await user.getAll()
const selectedUser = ref<User | null>(null)

function selectUser(item: User) {
	selectedUser.value = item
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
	<div class="flex flex-row h-[calc(100vh-96px)] gap-5">
		<UScrollArea class="w-1/4 h-full">
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
		<main class="w-3/4">
			<VisualWrapper>
				<div class="w-full flex flex-row justify-between items-center gap-5">
					<div>{{ selectedUser?.firstName }} {{ selectedUser?.lastName }}</div>

					<div class="flex flex-row gap-5">
						<UButton
							icon="i-lucide-video"
							size="lg"
							:ui="{
								leadingIcon: 'text-primary'
							}"
							@click="toCall('video')"
						/>
						<UButton
							icon="i-lucide-headphones"
							size="lg"
							:ui="{
								leadingIcon: 'text-primary'
							}"
							@click="toCall('audio')"
						/>
					</div>
				</div>
			</VisualWrapper>
		</main>
	</div>
</template>
