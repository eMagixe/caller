<script setup lang="ts">
import * as z from 'zod'
import type { BreadcrumbItem, FormSubmitEvent } from '@nuxt/ui'

enum AuthError {
	Error = 'Ошибка',
	Warning = 'Внимание',
	InvalidFirstName = 'Требуется имя',
	ValidateFirstName = 'Должно быть не менее 2 символов',
	InvalidLastName = 'Требуется фамилия',
	ValidateLastName = 'Должно быть не менее 2 символов',
	ValidateEmail = 'Неверный адрес электронной почты'
}

const schema = z.object({
	email: z.email(AuthError.ValidateEmail),
	firstName: z.string(AuthError.InvalidFirstName).min(2, AuthError.ValidateFirstName),
	lastName: z.string(AuthError.InvalidLastName).min(2, AuthError.ValidateLastName)
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
	email: '',
	firstName: '',
	lastName: ''
})

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {}

const items = ref<BreadcrumbItem[]>([
	{
		label: 'Пользователи',
		to: '/dashboard/users'
	},
	{
		label: 'Создать'
	}
])
</script>

<template>
	<UBreadcrumb :items="items" class="m-5" />
	<UForm
		:schema="schema"
		:state="state"
		class="flex gap-3 flex-col rounded-[17px] border border-[#ebe7ef] bg-white p-5 shadow-[0_10px_30px_#34304105] max-[600px]:p-4.25"
		@submit="onSubmit"
	>
		<FromTitle title="Новый пользователь" />
		<UFormField label="Email" name="email">
			<UInput v-model="state.email" class="w-full" />
		</UFormField>

		<UFormField label="Имя" name="firstName">
			<UInput v-model="state.firstName" class="w-full" />
		</UFormField>

		<UFormField label="Фамилия" name="lastName">
			<UInput v-model="state.lastName" class="w-full" />
		</UFormField>

		<UButton class="flex justify-center w-auto ml-auto px-10" type="submit"> Создать </UButton>
	</UForm>
</template>
