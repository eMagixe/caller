export function errorMessage(error: unknown, fallback = 'Что-то пошло не так. Попробуйте ещё раз.') {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data as { statusMessage?: string; message?: string } | undefined
    if (data?.message) return data.message
    if (data?.statusMessage) return data.statusMessage
  }
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') return 'Разрешите доступ к микрофону и камере в настройках браузера. Для звонков нужен HTTPS или localhost.'
    if (error.name === 'NotFoundError') return 'Микрофон или камера не найдены. Подключите устройство или выберите аудиозвонок.'
    if (error.name === 'NotReadableError') return 'Устройство занято другим приложением. Освободите его и попробуйте ещё раз.'
  }
  return error instanceof Error ? error.message : fallback
}
