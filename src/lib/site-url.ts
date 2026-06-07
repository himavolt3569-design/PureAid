export function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000'

  const withProtocol = url.startsWith('http') ? url : `https://${url}`

  return withProtocol.endsWith('/') ? withProtocol.slice(0, -1) : withProtocol
}
