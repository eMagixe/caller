<script setup lang="ts">
const infoOpen = ref(false)
const hydrated = ref(false)
onMounted(() => {
	hydrated.value = true
})
</script>

<template>
	<header class="mx-auto flex h-[102px] max-w-[1440px] items-center justify-between gap-6 border-b border-line px-16 max-[1100px]:px-9 max-[800px]:h-[82px] max-[600px]:h-[76px] max-[600px]:px-6">
		<NuxtLink to="/public" class="inline-flex items-center text-[31px] font-[780] tracking-[-1.8px] text-[#292433] no-underline max-[600px]:text-[28px]" aria-label="Caller — главная">
			<span class="mr-2.5 inline-flex h-9 w-9 rounded-[11px] bg-violet p-1.5 text-white shadow-[0_3px_8px_#7650e71f] max-[600px]:h-8 max-[600px]:w-8 max-[600px]:rounded-[10px]"
				><svg viewBox="0 0 32 32" fill="none">
					<path
						d="M8 7v9a9 9 0 009 9h8M15 7v8a3 3 0 003 3h7"
						stroke="currentColor"
						stroke-width="4.5"
						stroke-linecap="round"
					/></svg
			></span>
			caller<span class="text-violet">.</span>
		</NuxtLink>
		<div class="flex items-center gap-[9px] text-[12px] text-[#8a8693] max-[800px]:hidden"><span class="status-dot" /> Меньше расстояний. Больше общения.</div>
		<button class="flex items-center gap-2 text-[12px] font-[550] max-[600px]:text-[10px]" :disabled="!hydrated" @click="infoOpen = true">
			Как это работает <UIcon class="text-[17px]" name="i-lucide-arrow-up-right" />
		</button>
		<UModal
			v-model:open="infoOpen"
			title="Всего одна ссылка до встречи"
			description="Личные разговоры без регистрации и установки."
		>
			<template #body>
				<ol class="flex flex-col gap-6">
					<li class="flex gap-[15px]">
						<span class="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[#f0e9fb] text-[13px] text-violet">1</span>
						<div>
							<strong class="text-[14px]">Создайте комнату</strong>
							<p class="mt-1.5 text-[13px] leading-[1.7] text-[#92869e]">Выберите видео или аудио и укажите своё имя.</p>
						</div>
					</li>
					<li class="flex gap-[15px]">
						<span class="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[#f0e9fb] text-[13px] text-violet">2</span>
						<div>
							<strong class="text-[14px]">Пригласите собеседника</strong>
							<p class="mt-1.5 text-[13px] leading-[1.7] text-[#92869e]">
								Отправьте одноразовую ссылку лично. Она действует 30 минут. Проверьте имя гостя и
								подтвердите вход.
							</p>
						</div>
					</li>
					<li class="flex gap-[15px]">
						<span class="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[#f0e9fb] text-[13px] text-violet">3</span>
						<div>
							<strong class="text-[14px]">Будьте на связи</strong>
							<p class="mt-1.5 text-[13px] leading-[1.7] text-[#92869e]">
								Говорите и переписывайтесь. Аудио, видео и сообщения шифруются средствами WebRTC.
								Комната рассчитана на двух человек и действует до 12 часов.
							</p>
						</div>
					</li>
				</ol>
				<p class="modal-note mt-6">
					Ссылка даёт право запросить вход, но не подтверждает личность. При необходимости уточните имя
					собеседника по другому каналу. Сервер сигнализации участвует в установке соединения и должен быть
					доверенным.
				</p>
			</template>
		</UModal>
	</header>
</template>
