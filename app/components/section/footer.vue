<template>
	<footer
		class="mx-auto flex max-w-[1440px] items-center justify-between border-t border-line px-16 py-[25px] text-[10px] text-[#a89fac] max-[1100px]:px-9 max-[600px]:flex-wrap max-[600px]:gap-[15px] max-[600px]:px-6 max-[600px]:py-[22px] max-[600px]:text-[9px]"
	>
		<span class="flex items-center gap-[7px]">© {{ new Date().getFullYear() }} Caller</span
		><span class="flex items-center gap-[7px] max-[600px]:hidden"
			>Создано для живого общения <span class="text-[19px] text-[#b199d5]">✳</span></span
		><span class="flex items-center gap-[7px]"><span class="status-dot" /> Без записей разговоров</span>
	</footer>
</template>
