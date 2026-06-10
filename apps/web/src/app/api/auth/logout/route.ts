import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth'

export async function POST(request: Request) {
  await clearAuthCookies()
  const origin = new URL(request.url).origin
  return NextResponse.redirect(new URL('/login', origin))
}
