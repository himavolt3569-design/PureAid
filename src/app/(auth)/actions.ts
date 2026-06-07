'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/auth'
import { loginSchema, signupSchema } from '@/types/auth'

function safeRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard'
  }

  return value
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = Object.fromEntries(formData.entries())
  const parsed = loginSchema.safeParse(data)

  if (!parsed.success) {
    return { error: 'Invalid input. Please check your credentials.' }
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  if (authData.user) {
    await ensureProfile(supabase, authData.user)
  }

  revalidatePath('/', 'layout')
  redirect(safeRedirectPath(formData.get('next')))
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = Object.fromEntries(formData.entries())
  const parsed = signupSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input. Please check your details.' }
  }

  const { error: authError, data: authData } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        phone: parsed.data.phone || '',
        role: parsed.data.role,
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (authData.user && authData.session) {
    await ensureProfile(supabase, authData.user)
  }

  revalidatePath('/', 'layout')
  redirect(authData.session ? '/dashboard' : '/login')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
