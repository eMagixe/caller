<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { useAuth } from '~/composables/useAuth.ts'

const auth = useAuth()

const open = ref(false)

const getItemsAll = (state: 'collapsed' | 'expanded' = 'expanded') => {
	return [
		{
			label: 'Список',
			icon: 'i-lucide-users',
			to: '/record'
		}
	] as NavigationMenuItem[]
}

const menuToRole = () => {
	return auth?.isAdminUser.value
		? [
				{
					label: 'Список',
					icon: 'i-lucide-users',
					to: '/account/users'
				}
			]
		: []
}

const getItemsConfig = (state: 'collapsed' | 'expanded' = 'expanded') => {
	return menuToRole() as NavigationMenuItem[]
}

const userItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: 'Профиль',
			icon: 'i-lucide-users',
			onSelect: () => {
				navigateTo('/account/details')
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
	<div class="flex flex-1">
		<USidebar
			v-model:open="open"
			collapsible="icon"
			close
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
				<div v-if="auth.isAdminUser" class="flex flex-col gap-5">
					<UNavigationMenu
						:key="useId()"
						:items="getItemsConfig(state)"
						orientation="vertical"
						:ui="{ link: 'p-1.5 overflow-hidden' }"
					/>
				</div>
			</template>

			<template #footer>
				<UDropdownMenu
					:items="userItems"
					:content="{ align: 'center', collisionPadding: 12 }"
					:ui="{
						content: 'w-(--reka-dropdown-menu-trigger-width) bg-primary min-w-48 ring-0',
						viewport: 'border-none',
						item: 'hover:bg-primary/50!',
						itemLeadingIcon: 'text-white'
					}"
				>
					<UButton
						v-if="open"
						v-bind="auth.getUser()"
						:label="auth.getUser()?.name || 'Default'"
						trailing-icon="i-lucide-chevrons-up-down"
						color="neutral"
						variant="ghost"
						class="w-full data-[state=open]:bg-brimary hover:bg-primary overflow-hidden text-white bg-primary/50"
						:ui="{
							trailingIcon: 'text-white ms-auto'
						}"
					/>
					<UButton icon="i-lucide-user" class="m-auto" size="md" v-else />
				</UDropdownMenu>
			</template>
		</USidebar>

		<div class="flex-1 flex flex-col h-screen">
			<div class="h-(--ui-header-height) shrink-0 flex items-center px-4">
				<UButton
					icon="i-lucide-panel-left"
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
</template>
