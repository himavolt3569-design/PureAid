import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard'
  }

  return value
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = safeNextPath(request.nextUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, request.nextUrl.origin))
    }

    console.error('Unable to exchange Supabase auth code.', error)
  }

  const redirectUrl = new URL('/login', request.nextUrl.origin)
  redirectUrl.searchParams.set('error', 'Unable to confirm your email. Please try logging in.')

  return NextResponse.redirect(redirectUrl)
}
