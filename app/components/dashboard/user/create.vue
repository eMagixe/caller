<script setup lang="ts">
import * as z from 'zod'
import type { BreadcrumbItem, FormSubmitEvent } from '@nuxt/ui'

enum UserCreateError {
	Error = 'Ошибка',
	Warning = 'Внимание',
	InvalidFirstName = 'Требуется имя',
	ValidateFirstName = 'Должно быть не менее 2 символов',
	InvalidLastName = 'Требуется фамилия',
	ValidateLastName = 'Должно быть не менее 2 символов',
	ValidateEmail = 'Неверный адрес электронной почты',
	InvalidPassword = 'Требуется пароль',
	ValidatePassword = 'Должно быть не менее 8 символов'
}

const schema = z.object({
	email: z.email(UserCreateError.ValidateEmail),
	firstName: z.string(UserCreateError.InvalidFirstName).min(2, UserCreateError.ValidateFirstName),
	lastName: z.string(UserCreateError.InvalidLastName).min(2, UserCreateError.ValidateLastName),
	password: z.string(UserCreateError.InvalidPassword).min(8, UserCreateError.ValidatePassword)
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
	email: '',
	firstName: '',
	lastName: '',
	password: ''
})

const toast = useToast()
const user = useUser()

async function onSubmit(event: FormSubmitEvent<Schema>) {
	if (state.lastName && state.firstName && state.email) {
		await user
			.create({
				email: state.email,
				firstName: state.firstName,
				lastName: state.lastName,
				role: 'user'
			})
			.then(() => {
				toast.add({
					title: 'Пользователь создан',
					description: 'Пользователь успешно создан',
					color: 'success'
				})
				userCreated.value = true
			})
			.catch((error) => {
				toast.add({
					title: 'Ошибка',
					description: error.message,
					color: 'error'
				})
			})
	}
}

const code = ref('')
const userCreated = ref(false)
const profile = useProfile()

async function confirmCode() {
	if (state.email && state.password && code.value) {
		await profile.confirmProfile({
			email: state.email,
			password: state.password,
			code: code.value
		})
	}
}

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
	<VisualWrapper>
		<UForm :schema="schema" :state="state" class="flex gap-3 flex-col" @submit="onSubmit">
			<FormTitle title="Новый пользователь" />
			<UFormField label="Email" name="email">
				<UInput v-model="state.email" type="email" />
			</UFormField>

			<UFormField label="Имя" name="firstName">
				<UInput v-model="state.firstName" />
			</UFormField>

			<UFormField label="Фамилия" name="lastName">
				<UInput v-model="state.lastName" />
			</UFormField>

			<UFormField label="Пароль" name="password">
				<UInput v-model="state.password" type="password" />
			</UFormField>

			<UButton class="flex justify-center w-auto ml-auto px-10" type="submit"> Создать </UButton>
		</UForm>
	</VisualWrapper>
	<VisualWrapper v-if="userCreated">
		<UForm class="flex gap-3 flex-col">
			<FormTitle title="Активация профиля" />
			<UFormField label="Код авторизации" name="code">
				<UInput v-model="code" />
			</UFormField>

			<UButton class="flex justify-center w-auto ml-auto px-10" @click="confirmCode"> Отправить </UButton>
		</UForm>
	</VisualWrapper>
</template>
