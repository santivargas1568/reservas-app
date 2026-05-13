// middleware.ts
// Protege todas las rutas /admin/* verificando el JWT de sesión.
// Si no hay sesión válida, redirige a /admin/login.

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'

const SESSION_COOKIE = 'reservas_admin_session'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // No proteger la página de login
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Proteger todas las rutas /admin/*
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(SESSION_COOKIE)?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    const session = await verifyAdminToken(token)

    if (!session) {
      // Token inválido o expirado → eliminar cookie y redirigir
      const response = NextResponse.redirect(new URL('/admin/login', req.url))
      response.cookies.delete(SESSION_COOKIE)
      return response
    }

    // Inyectar datos del admin en headers para uso en Server Components
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-admin-id', session.id)
    requestHeaders.set('x-admin-email', session.email)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
