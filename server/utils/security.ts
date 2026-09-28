import { createError, getCookie, getHeader, getRequestIP, getRequestURL, getRouterParam, setCookie, type H3Event } from 'h3'
import { z } from 'zod'
import { ROOM_TTL, RoomError, roomStore } from './room-store'

export const nameSchema = z.string().trim().min(1).max(40)
export const roomIdSchema = z.uuid()
export const cookieName = (id: string) => `caller_${id}`
export const clientIp = (event: H3Event) => getRequestIP(event, { xForwardedFor: useRuntimeConfig().trustProxy }) || 'unknown'
const buckets = new Map<string, { count: number; reset: number }>()

export function limit(key: string, maximum: number, window = 60_000) {
  const now = Date.now()
  if (buckets.size > 10_000) for (const [id, value] of buckets) if (value.reset < now) buckets.delete(id)
  let bucket = buckets.get(key)
  if (!bucket || bucket.reset <= now) {
    if (buckets.size >= 20_000) throw createError({ statusCode: 503, message: 'Сервис занят.' })
    bucket = { count: 0, reset: now + window }
    buckets.set(key, bucket)
  }
  if (++bucket.count > maximum) throw createError({ statusCode: 429, message: 'Слишком много запросов. Попробуйте через минуту.' })
}

export function expectedOrigin(requestUrl: string) {
  const config = useRuntimeConfig()
  if (process.env.NODE_ENV === 'production' && !config.appOrigin) throw createError({ statusCode: 503, message: 'Настройте NUXT_APP_ORIGIN.' })
  return config.appOrigin || new URL(requestUrl).origin
}

export function guardMutation(event: H3Event) {
  const origin = getHeader(event, 'origin')
  if (!origin || origin !== expectedOrigin(getRequestURL(event).href)) throw createError({ statusCode: 403, message: 'Недопустимый источник запроса.' })
  if (!getHeader(event, 'content-type')?.startsWith('application/json')) throw createError({ statusCode: 415, message: 'Ожидается JSON.' })
  limit(`http:${clientIp(event)}`, 60)
}

export function saveSession(event: H3Event, id: string, session: string) {
  setCookie(event, cookieName(id), session, {
    httpOnly: true, sameSite: 'strict', secure: expectedOrigin(getRequestURL(event).href).startsWith('https:'),
    path: `/api/rooms/${id}`, maxAge: ROOM_TTL / 1000,
  })
}

export function sessionFor(event: H3Event) {
  const id = roomIdSchema.parse(getRouterParam(event, 'id'))
  return roomStore.authenticate(id, getCookie(event, cookieName(id)))
}

export function apiError(error: unknown): never {
  if (error instanceof RoomError) throw createError({ statusCode: error.statusCode, message: error.message })
  if (error instanceof z.ZodError) throw createError({ statusCode: 400, message: 'Проверьте введённые данные.' })
  throw error
}
