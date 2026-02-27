// Usa Web Crypto API (compatible con Edge runtime en middleware)

const COOKIE_NAME = "gastito_auth"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

function getSecret(): string {
  const secret = process.env.APP_PASSWORD
  if (!secret) {
    throw new Error("APP_PASSWORD no está configurada en .env.local")
  }
  return secret
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  )
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function createAuthTokenWithSignature(): Promise<string> {
  const secret = getSecret()
  const timestamp = Date.now().toString()
  const signature = await hmacSha256(secret, timestamp)
  return `${timestamp}.${signature}`
}

export async function verifyAuthToken(token: string): Promise<boolean> {
  try {
    const secret = getSecret()
    const [timestamp, signature] = token.split(".")
    if (!timestamp || !signature) return false

    const expected = await hmacSha256(secret, timestamp)

    if (expected.length !== signature.length) return false
    const expectedBuf = new Uint8Array(
      expected.match(/.{2}/g)!.map((b) => parseInt(b, 16))
    )
    const actualBuf = new Uint8Array(
      signature.match(/.{2}/g)!.map((b) => parseInt(b, 16))
    )

    let diff = 0
    for (let i = 0; i < expectedBuf.length; i++) {
      diff |= expectedBuf[i] ^ actualBuf[i]
    }
    if (diff !== 0) return false

    const age = Date.now() - parseInt(timestamp, 10)
    return age < COOKIE_MAX_AGE * 1000
  } catch {
    return false
  }
}

export function verifyPassword(password: string): boolean {
  try {
    const secret = getSecret()
    if (secret.length !== password.length) return false
    let diff = 0
    for (let i = 0; i < secret.length; i++) {
      diff |= secret.charCodeAt(i) ^ password.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

export async function getAuthCookieHeader(): Promise<string> {
  const token = await createAuthTokenWithSignature()
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
}

export function getAuthCookieName(): string {
  return COOKIE_NAME
}
