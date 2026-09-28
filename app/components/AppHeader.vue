<script setup lang="ts">
const infoOpen = ref(false)
const hydrated = ref(false)
onMounted(() => { hydrated.value = true })
</script>

<template>
  <header class="app-header">
    <NuxtLink to="/" class="brand" aria-label="Caller — главная">
      <span class="brand-mark"><svg viewBox="0 0 32 32" fill="none"><path d="M8 7v9a9 9 0 009 9h8M15 7v8a3 3 0 003 3h7" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" /></svg></span>
      caller<span class="brand-dot">.</span>
    </NuxtLink>
    <div class="header-center"><span class="status-dot" /> Меньше расстояний. Больше общения.</div>
    <button class="header-help" :disabled="!hydrated" @click="infoOpen = true">Как это работает <UIcon name="i-lucide-arrow-up-right" /></button>
    <UModal v-model:open="infoOpen" title="Всего одна ссылка до встречи" description="Личные разговоры без регистрации и установки.">
      <template #body>
        <ol class="help-steps">
          <li><span>1</span><div><strong>Создайте комнату</strong><p>Выберите видео или аудио и укажите своё имя.</p></div></li>
          <li><span>2</span><div><strong>Пригласите собеседника</strong><p>Отправьте одноразовую ссылку лично. Она действует 30 минут. Проверьте имя гостя и подтвердите вход.</p></div></li>
          <li><span>3</span><div><strong>Будьте на связи</strong><p>Говорите и переписывайтесь. Аудио, видео и сообщения шифруются средствами WebRTC. Комната рассчитана на двух человек и действует до 12 часов.</p></div></li>
        </ol>
        <p class="modal-note">Ссылка даёт право запросить вход, но не подтверждает личность. При необходимости уточните имя собеседника по другому каналу. Сервер сигнализации участвует в установке соединения и должен быть доверенным.</p>
      </template>
    </UModal>
  </header>
</template>
