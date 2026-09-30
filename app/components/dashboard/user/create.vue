<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

enum AuthError {
	Error = 'Ошибка',
	Warning = 'Внимание',
	InvalidPassword = 'Требуется пароль',
	InvalidCredentials = 'Требуются электронная почта и пароль.',
	ValidatePassword = 'Должно быть не менее 8 символов',
	ValidateEmail = 'Неверный адрес электронной почты'
}

const schema = z.object({
	email: z.email(AuthError.ValidateEmail),
	password: z.string(AuthError.InvalidPassword).min(8, AuthError.ValidatePassword)
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
	email: 'emax.mails@gmail.com',
	password: 'UIOGF82uio!'
})

const toast = useToast()
const auth = useAuth()

async function onSubmit(event: FormSubmitEvent<Schema>) {
	if (!state.email || !state.password) {
		return toast.add({ title: AuthError.Warning, description: AuthError.InvalidCredentials, color: 'warning' })
	}

	await auth
		.login(state.email, state.password)
		.then(async () => {
			await navigateTo('/dashboard')
		})
		.catch(() => {
			toast.add({ title: AuthError.Error, description: AuthError.InvalidCredentials, color: 'error' })
		})
}
</script>

<template>
	<UForm
		:schema="schema"
		:state="state"
		class="flex gap-3 flex-col rounded-[17px] border border-[#ebe7ef] bg-white p-5 shadow-[0_10px_30px_#34304105] max-[600px]:p-4.25"
		@submit="onSubmit"
	>
		<VisualLogo class="m-auto" />
		<UFormField label="Email" name="email">
			<UInput v-model="state.email" variant="ghost" />
		</UFormField>

		<UFormField label="Пароль" name="password">
			<UInput v-model="state.password" type="password" />
		</UFormField>

		<UButton class="flex justify-center w-full" type="submit"> Войти </UButton>
	</UForm>
</template>
