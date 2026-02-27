import { NextResponse } from "next/server"
import { getAuthCookieName } from "@/lib/auth"

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.headers.set(
    "Set-Cookie",
    `${getAuthCookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  )
  return response
}
