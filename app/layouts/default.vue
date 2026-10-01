<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { useAuth, useProfile } from '#imports'

const auth = useAuth()
const profile = useProfile()
const user = await profile.getUser()

const open = ref(false)

const getItemsAll = (state: 'collapsed' | 'expanded' = 'expanded') => {
	return [
		{
			label: 'Список',
			icon: 'i-lucide-user',
			to: '/dashboard',
			onSelect: () => {
				open.value = false
				navigateTo('/dashboard')
			}
		}
	] as NavigationMenuItem[]
}

const userItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: 'Профиль',
			icon: 'i-lucide-user',
			onSelect: () => {
				open.value = false
				navigateTo('/dashboard/profile')
			}
		},
		{
			label: 'Добавить',
			icon: 'i-lucide-plus',
			onSelect: () => {
				open.value = false
				navigateTo('/dashboard/users/create')
			}
		},
		{
			label: 'Выйти',
			icon: 'i-lucide-log-out',
			onSelect: () => {
				auth.logout()
			}
		}
	]
])
</script>

<template>
	<UApp>
		<div class="flex flex-1">
			<USidebar
				v-model:open="open"
				collapsible="icon"
				:ui="{
					container: 'h-full border-gray-300 text-primary',
					header: 'border-b-gray-300 ',
					inner: 'divide-transparent',
					body: 'py-0 border-b-gray-300'
				}"
			>
				<template #header>
					<VisualLogo />
				</template>

				<template #default="{ state }">
					<UNavigationMenu
						:key="useId()"
						:items="getItemsAll(state)"
						orientation="vertical"
						class="mt-5"
						:ui="{
							link: 'p-1.5 overflow-hidden'
						}"
					/>
				</template>

				<template #footer>
					<UDropdownMenu
						:items="userItems"
						:content="{ align: 'center', collisionPadding: 12 }"
						:ui="{
							content: 'w-(--reka-dropdown-menu-trigger-width) bg-primary min-w-48 ring-0',
							viewport: 'border-none',
							itemLabel: 'text-white',
							item: 'hover:bg-primary/50!',
							itemLeadingIcon: 'text-white'
						}"
					>
						<UButton
							v-if="open"
							v-bind="auth.isAuthenticated"
							:label="user ? user.firstName : 'Default'"
							trailing-icon="i-lucide-chevrons-up-down"
							color="neutral"
							variant="ghost"
							class="w-full data-[state=open]:bg-brimary hover:bg-primary overflow-hidden bg-primary/50"
							:ui="{
								trailingIcon: 'text-white ms-auto',
								label: 'text-white'
							}"
						/>
						<UButton
							icon="i-lucide-user"
							class="m-auto"
							size="md"
							:ui="{
								leadingIcon: 'text-primary'
							}"
							v-else
						/>
					</UDropdownMenu>
				</template>
			</USidebar>

			<div class="flex-1 flex flex-col h-screen">
				<div class="h-(--ui-header-height) shrink-0 flex items-center px-4">
					<UButton
						icon="i-lucide-panel-left"
						:ui="{
							leadingIcon: 'text-primary/30'
						}"
						class="text-primary/30"
						variant="ghost"
						aria-label="Toggle sidebar"
						@click="open = !open"
					/>
				</div>

				<div class="flex-1 p-4 h-screen w-full">
					<slot />
				</div>
			</div>
		</div>
	</UApp>
</template>
