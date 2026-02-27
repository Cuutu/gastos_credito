import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuthToken, getAuthCookieName } from "@/lib/auth"

const publicPaths = ["/login", "/api/auth"]

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
}

export async function middleware(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(getAuthCookieName())
  const token = cookie?.value

  try {
    if (!token || !(await verifyAuthToken(token))) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("from", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    // APP_PASSWORD no configurada o error de verificación → redirigir a login
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$|.*\\.jpg$).*)",
  ],
}
