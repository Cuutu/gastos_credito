import { NextResponse } from "next/server"
import { verifyPassword, getAuthCookieHeader } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const password = body?.password

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Contraseña requerida" },
        { status: 400 }
      )
    }

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true })
    response.headers.set("Set-Cookie", await getAuthCookieHeader())
    return response
  } catch (e) {
    if (e instanceof Error && e.message.includes("APP_PASSWORD")) {
      return NextResponse.json(
        { error: "La app no está configurada. Agregá APP_PASSWORD en .env.local" },
        { status: 500 }
      )
    }
    throw e
  }
}
