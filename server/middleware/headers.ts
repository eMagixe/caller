export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(self), microphone=(self), display-capture=(self)',
    'Cache-Control': 'no-store',
  })
  if (process.env.NODE_ENV === 'production') {
    setResponseHeader(event, 'Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'")
    if (useRuntimeConfig().appOrigin.startsWith('https:')) setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000')
  }
})